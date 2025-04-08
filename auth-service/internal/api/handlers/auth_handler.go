// internal/api/handlers/auth_handler.go (完整版)
package handlers

import (
	"auth-service/internal/services"
	"auth-service/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"time"
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
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(
	authService services.AuthService,
	cookieDomain string,
	secureCookie bool,
	accessExpiry time.Duration,
	refreshExpiry time.Duration,
) *AuthHandler {
	return &AuthHandler{
		authService:   authService,
		cookieDomain:  cookieDomain,
		secureCookie:  secureCookie,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
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
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}
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
	if authHeader == "" {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenMissing, nil))
		return
	}

	// 提取Bearer Token
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenInvalid, nil))
		return
	}
	tokenString := tokenParts[1]

	// 验证Token
	claims, err := h.authService.VerifyToken(tokenString)
	if err != nil {
		code := utils.CodeTokenInvalid
		if strings.Contains(err.Error(), "用户无效或已被禁用") {
			code = utils.CodeUserInactive
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"active":   true,
		"user_id":  claims.UserID,
		"username": claims.Username,
	}))
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

// Health 健康检查
func (h *AuthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "auth-service",
		"version": "v1.0.0",
	})
}
