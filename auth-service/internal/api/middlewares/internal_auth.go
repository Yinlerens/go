// internal/api/middlewares/internal_auth.go
package middlewares

import (
	"auth-service/internal/utils"
	"github.com/gin-gonic/gin"
)

// InternalAuth 服务间认证中间件
func InternalAuth(apiKeys map[string]string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取API Key
		apiKey := c.GetHeader("X-Internal-API-Key")
		if apiKey == "" {
			c.JSON(200, utils.NewResponse(utils.CodeNoPermission, nil))
			c.Abort()
			return
		}

		// 验证API Key
		valid := false
		for _, validKey := range apiKeys {
			if apiKey == validKey {
				valid = true
				break
			}
		}

		if !valid {
			c.JSON(200, utils.NewResponse(utils.CodeNoPermission, nil))
			c.Abort()
			return
		}

		c.Next()
	}
}
