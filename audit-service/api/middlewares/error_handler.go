package middlewares

import (
	"log"
	"runtime/debug"

	"github.com/gin-gonic/gin"

	"audit-service/utils"
)

// ErrorHandler 全局错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录堆栈信息
				stack := debug.Stack()
				log.Printf("服务器内部错误: %v\n%s", err, stack)

				// 返回统一的错误响应
				c.JSON(200, utils.NewResponse(utils.CodeInternalServerError, nil))
				c.Abort()
			}
		}()
		c.Next()
	}
}
