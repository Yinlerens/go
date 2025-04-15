package middlewares

import (
	"audit-sdk/client"
	"audit-sdk/middleware"
	"github.com/gin-gonic/gin"
)

// AuditMiddleware 审计中间件
func AuditMiddleware(auditClient client.Client) gin.HandlerFunc {
	return middleware.GinAuditMiddleware(auditClient, "rbac-service", []string{"/health"})
}
