// auth-service/internal/api/handlers/auth_handler.go
package handlers

import (
	"auth-service/internal/services"
	"auth-service/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"time"

	"github.com/Yinlerens/audit-sdk/client"
)

// 请求结构体
type registerRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthHandler 认证处理器
type AuthHandler struct {
	authService   services.AuthService
	cookieDomain  string
	secureCookie  bool
	accessExpiry  time.Duration
	refreshExpiry time.Duration
	auditClient   client.Client // 添加审计客户端
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(
	authService services.AuthService,
	cookieDomain string,
	secureCookie bool,
	accessExpiry time.Duration,
	refreshExpiry time.Duration,
	auditClient client.Client, // 添加审计客户端参数
) *AuthHandler {
	return &AuthHandler{
		authService:   authService,
		cookieDomain:  cookieDomain,
		secureCookie:  secureCookie,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
		auditClient:   auditClient,
	}
}

// Login 用户登录处理
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务进行登录
	user, accessToken, refreshToken, err := h.authService.Login(req.Username, req.Password)

	if err != nil {
		code := utils.CodeInternalServerError
		// 根据错误信息确定业务状态码
		switch {
		case strings.Contains(err.Error(), "用户名或密码错误"):
			code = utils.CodeInvalidCredentials
		case strings.Contains(err.Error(), "用户不存在"):
			code = utils.CodeUserNotFound
		case strings.Contains(err.Error(), "账户已被禁用"):
			code = utils.CodeUserInactive
		}

		// 记录登录失败审计
		h.auditClient.LogWithContext(
			c,
			client.EventUserLogin,
			client.ResultFailure,
			map[string]interface{}{
				"resource_type": "user",
				"username":      req.Username,
				"error_code":    code,
				"error_message": err.Error(),
			},
		)
		utils.Error("登录失败", err.Error())
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 记录登录成功审计
	h.auditClient.LogWithContext(
		c,
		client.EventUserLogin,
		client.ResultSuccess,
		map[string]interface{}{
			"resource_type": "user",
			"resource_id":   user.UserID,
			"username":      user.Username,
		},
	)

	// 设置Cookie: refresh_auth_token
	c.SetCookie(
		"refresh_auth_token",
		refreshToken,
		int(h.refreshExpiry.Seconds()),
		"/",
		h.cookieDomain,
		h.secureCookie,
		true, // HttpOnly
	)

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"user_id":      user.UserID,
		"username":     user.Username,
		"access_token": accessToken,
	}))
}

// Verify 验证访问令牌
func (h *AuthHandler) Verify(c *gin.Context) {
	// 从Authorization头获取Token
	authHeader := c.GetHeader("Authorization")
	// 1. Token 缺失 -> 返回 401
	if authHeader == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, utils.NewResponse(utils.CodeTokenMissing, "Authorization header is missing"))
		return
	}

	// 2. 提取Bearer Token, 格式错误 -> 返回 401
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, utils.NewResponse(utils.CodeTokenInvalid, "Invalid token format"))
		return
	}
	tokenString := tokenParts[1]

	// 3. 验证Token
	claims, err := h.authService.VerifyToken(tokenString)
	if err != nil {
		// 验证失败 -> 返回 401
		errMsg := "Token validation failed"
		responseCode := utils.CodeTokenInvalid
		if strings.Contains(err.Error(), "用户无效或已被禁用") {
			errMsg = "User inactive or invalid"
			responseCode = utils.CodeUserInactive // 如果你的工具包区分了这个
		}
		// 返回 401
		c.AbortWithStatusJSON(http.StatusUnauthorized, utils.NewResponse(responseCode, errMsg))
		return
	}
	c.Header("X-User-Id", claims.UserID) // UserID 应该是字符串类型
	c.Header("X-Username", claims.Username)
	// 4. 验证成功 -> 返回 200 OK
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, "Token verified successfully"))
	// Nginx Ingress 需要配置 nginx.ingress.kubernetes.io/auth-response-headers: "X-User-Id,X-Username"
}

// Refresh 刷新访问令牌
func (h *AuthHandler) Refresh(c *gin.Context) {
	// 从Cookie获取刷新令牌
	refreshToken, err := c.Cookie("refresh_auth_token")
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenMissing, nil))
		return
	}

	// 刷新令牌
	newAccessToken, newRefreshToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		code := utils.CodeTokenInvalid
		if strings.Contains(err.Error(), "用户无效或已被禁用") {
			code = utils.CodeUserInactive
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 设置新的Cookie: auth_token
	c.SetCookie(
		"auth_token",
		newAccessToken,
		int(h.accessExpiry.Seconds()),
		"/",
		h.cookieDomain,
		h.secureCookie,
		true, // HttpOnly
	)

	// 设置新的Cookie: refresh_auth_token
	c.SetCookie(
		"refresh_auth_token",
		newRefreshToken,
		int(h.refreshExpiry.Seconds()),
		"/",
		h.cookieDomain,
		h.secureCookie,
		true, // HttpOnly
	)

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// Logout 用户登出
func (h *AuthHandler) Logout(c *gin.Context) {
	// 获取用户信息
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")

	// 验证访问令牌 (可选，取决于业务需求)
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
			_, err := h.authService.VerifyToken(tokenParts[1])
			if err != nil && !strings.Contains(err.Error(), "用户无效或已被禁用") {
				c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenInvalid, nil))
				return
			}
		}
	}

	// 从Cookie获取刷新令牌
	refreshToken, _ := c.Cookie("refresh_auth_token")

	// 调用服务进行登出
	if err := h.authService.Logout(refreshToken); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// 记录登出审计事件
	h.auditClient.LogWithContext(
		c,
		client.EventUserLogout,
		client.ResultSuccess,
		map[string]interface{}{
			"resource_type": "user",
			"resource_id":   userID,
			"username":      username,
		},
	)

	// 清除Cookie: auth_token
	c.SetCookie(
		"auth_token",
		"",
		-1,
		"/",
		h.cookieDomain,
		h.secureCookie,
		true,
	)

	// 清除Cookie: refresh_auth_token
	c.SetCookie(
		"refresh_auth_token",
		"",
		-1,
		"/",
		h.cookieDomain,
		h.secureCookie,
		true,
	)

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// Register 用户注册处理
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务进行注册
	user, err := h.authService.Register(req.Username, req.Password)
	if err != nil {
		code := utils.CodeInternalServerError
		// 根据错误信息确定业务状态码
		switch {
		case strings.Contains(err.Error(), "用户名格式或长度无效"):
			code = utils.CodeInvalidParams
		case strings.Contains(err.Error(), "密码长度至少需要6位"):
			code = utils.CodePasswordInvalid
		case strings.Contains(err.Error(), "用户名已被注册"):
			code = utils.CodeUsernameExists
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"user_id":  user.UserID,
		"username": user.Username,
	}))
}
func (h *AuthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "auth-service",
		"version": "v1.0.0",
	})
}