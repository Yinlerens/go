package middlewares

import (
	"github.com/Yinlerens/audit-sdk/client"
	"github.com/Yinlerens/audit-sdk/middleware"
	"github.com/gin-gonic/gin"
)

// AuditMiddleware 审计中间件
func AuditMiddleware(auditClient client.Client) gin.HandlerFunc {
	return middleware.GinAuditMiddleware(auditClient, "menu-service", []string{"/health"})
}