package middlewares

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"audit-service/utils"
)

// JWTAuthMiddleware JWT认证中间件
func JWTAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从Authorization头获取Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenMissing, nil))
			c.Abort()
			return
		}

		// 提取Bearer Token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenInvalid, nil))
			c.Abort()
			return
		}
		tokenString := parts[1]

		// 解析Token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// 验证签名方法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("无效的签名方法: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenInvalid, nil))
			c.Abort()
			return
		}

		// 验证Token有效性
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// 设置用户信息到上下文
			c.Set("user_id", claims["user_id"])
			c.Set("username", claims["username"])
			c.Next()
		} else {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeTokenInvalid, nil))
			c.Abort()
			return
		}
	}
}

// RBACMiddleware RBAC权限检查中间件
func RBACMiddleware(permissionKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否有对应权限
		// 此处需要调用RBAC服务检查权限，这里简化为检查用户角色

		// 获取用户角色
		role, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeNoPermission, nil))
			c.Abort()
			return
		}

		// 检查权限（实际项目中应该调用RBAC服务）
		if role != "admin" {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeNoPermission, nil))
			c.Abort()
			return
		}

		c.Next()
	}
}
