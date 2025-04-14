// internal/api/middlewares/user_context.go
package middlewares

import (
	"github.com/gin-gonic/gin"
)

// UserContext 中间件，自动从请求中提取用户上下文信息
func UserContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取用户信息
		userID := c.GetHeader("X-User-ID")
		username := c.GetHeader("X-Username")
		userIP := c.ClientIP()

		// 将信息保存到上下文中
		c.Set("user_id", userID)
		c.Set("username", username)
		c.Set("user_ip", userIP)

		c.Next()
	}
}