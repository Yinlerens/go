package middlewares

import (
	"github.com/gin-gonic/gin"
	"net/http" // 引入 net/http 包
)

// CORS 跨域资源共享中间件
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 获取请求的 Origin 头
		origin := c.Request.Header.Get("Origin")
		// 2. 定义允许的源列表 (根据你的实际情况配置)
		allowedOrigins := []string{
			"http://localhost:3000", // 开发环境
			"https://syuan.email",   // 生产环境前端地址
			// ... 其他允许的源
		}

		// 3. 检查请求的 Origin 是否在允许列表中
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				isAllowed = true
				break
			}
		}

		// 4. 如果允许，则设置具体的 Origin，否则不设置或按需处理
		if isAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)                                                                                                              // 设置为具体的请求源
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")                                                                                                         // 允许凭证
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Internal-API-Key, X-Requested-With") // 按需添加 'X-Requested-With' 等
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type") // 按需暴露头
		} else {
			// 如果 Origin 不被允许，可以选择不设置 CORS 头，或者返回错误
			// 这里简单地不设置允许特定 Origin 的头
			// 或者你可以返回一个 403 Forbidden 错误
			// c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CORS origin not allowed"})
			// return
		}

		// 处理预检请求 (OPTIONS)
		if c.Request.Method == "OPTIONS" {
			// 预检请求也需要检查 Origin 并设置正确的 Allow-Origin
			// 上面的逻辑已经处理了 isAllowed 的情况
			if isAllowed {
				c.AbortWithStatus(http.StatusNoContent) // 使用 204 No Content 更标准
			} else {
				// 对于不允许的 Origin 的预检请求，可以返回错误或不响应
				c.AbortWithStatus(http.StatusForbidden)
			}
			return
		}

		c.Next()
	}
}
