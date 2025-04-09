// internal/api/middlewares/internal_auth.go
package middlewares

import (
	"github.com/gin-gonic/gin"
	"rbac-service/internal/utils"
)

// InternalAuth 服务间认证中间件
func InternalAuth(apiKeys map[string]string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取API Key
		apiKey := c.GetHeader("X-Internal-API-Key")
		if apiKey == "" {
			c.JSON(200, utils.NewResponse(utils.CodeAPIKeyInvalid, nil))
			c.Abort()
			return
		}

		// 验证API Key
		valid := false
		var serviceID string
		for id, validKey := range apiKeys {
			if apiKey == validKey {
				valid = true
				serviceID = id
				break
			}
		}

		if !valid {
			c.JSON(200, utils.NewResponse(utils.CodeAPIKeyInvalid, nil))
			c.Abort()
			return
		}

		// 设置调用者信息
		c.Set("caller_id", serviceID)
		c.Set("caller_type", "SERVICE")

		c.Next()
	}
}
