package auth

import (
	"back/utils/response"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/logto-io/go/v2/client"
)

// LogtoAuthMiddleware 创建一个Logto认证中间件
func LogtoAuthMiddleware(logtoConfig *client.LogtoConfig) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		session := sessions.Default(ctx)
		logtoClient := client.NewLogtoClient(logtoConfig, NewSessionStorage(session))

		// 检查用户是否已认证
		if !logtoClient.IsAuthenticated() {
			response.Unauthorized(ctx, "用户未登录", "请先登录后再访问此资源")
			ctx.Abort()
			return
		}

		// 将logtoClient添加到上下文中，以便后续处理函数使用
		ctx.Set("logtoClient", logtoClient)
		ctx.Next()
	}
}

// GetLogtoClient 从上下文中获取LogtoClient
func GetLogtoClient(ctx *gin.Context) *client.LogtoClient {
	value, exists := ctx.Get("logtoClient")
	if !exists {
		return nil
	}
	return value.(*client.LogtoClient)
}
