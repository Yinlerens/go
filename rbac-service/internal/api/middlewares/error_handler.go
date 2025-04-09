// internal/api/middlewares/error_handler.go
package middlewares

import (
	"github.com/gin-gonic/gin"
	"log"
	"rbac-service/internal/utils"
	"runtime/debug"
)

// ErrorHandler 全局错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录堆栈信息
				log.Printf("服务器内部错误: %v\n%s", err, debug.Stack())
				// 返回统一的错误响应
				c.JSON(200, utils.NewResponse(utils.CodeInternalError, nil))
				c.Abort()
			}
		}()
		c.Next()
	}
}
