package middleware

import (
	"fmt"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"audit-sdk/client"
)

// GinAuditMiddleware Gin框架审计中间件
func GinAuditMiddleware(auditClient client.Client, serviceName string, skipPaths []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查是否跳过该路径
		for _, path := range skipPaths {
			if path == c.Request.URL.Path {
				c.Next()
				return
			}
		}

		// 生成请求ID
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)

		// 记录请求开始时间
		startTime := time.Now()

		// 获取用户信息
		userID, _ := c.Get("user_id")
		username, _ := c.Get("username")

		// 创建上下文记录请求信息
		c.Set("audit_context", map[string]interface{}{
			"request_id":     requestID,
			"client_ip":      c.ClientIP(),
			"user_agent":     c.Request.UserAgent(),
			"request_path":   c.Request.URL.Path,
			"request_method": c.Request.Method,
			"service_name":   serviceName,
			"user_id":        userID,
			"username":       username,
		})

		// 将审计客户端存入上下文
		c.Set("audit_client", auditClient)

		// 处理请求
		c.Next()

		// 获取响应状态
		statusCode := c.Writer.Status()
		latency := time.Since(startTime)
		responseCode, exists := c.Get("response_code")
		if !exists {
			responseCode = 0
		}

		// 获取错误信息
		errMsg, _ := c.Get("error_message")

		// 确定结果类型
		result := client.ResultSuccess
		if statusCode >= 400 {
			result = client.ResultFailure
		}

		// 记录API访问事件
		details := map[string]interface{}{
			"status_code":   statusCode,
			"latency_ms":    latency.Milliseconds(),
			"response_code": responseCode,
		}

		if errMsg != nil {
			details["error_message"] = fmt.Sprintf("%v", errMsg)
		}

		// 记录审计事件
		auditClient.LogWithContext(c, client.EventAPIAccess, result, details)
	}
}

// ErrorAuditMiddleware 错误审计中间件
func ErrorAuditMiddleware(auditClient client.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 使用defer捕获panic
		defer func() {
			if err := recover(); err != nil {
				// 获取堆栈信息
				stack := string(debug.Stack())

				// 记录系统错误
				auditClient.LogError(
					fmt.Errorf("%v", err),
					map[string]interface{}{
						"stack_trace":    stack,
						"request_path":   c.Request.URL.Path,
						"request_method": c.Request.Method,
						"client_ip":      c.ClientIP(),
					},
				)

				// 继续正常的错误处理流程
				c.AbortWithStatusJSON(500, gin.H{
					"code": 9999,
					"msg":  "服务器内部错误",
					"data": nil,
				})
			}
		}()

		c.Next()
	}
}
