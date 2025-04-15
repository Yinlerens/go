package routes

import (
	"github.com/gin-gonic/gin"

	"audit-service/api/handlers"
	"audit-service/api/middlewares"
	"audit-service/services"
)

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, auditService services.AuditService, jwtSecret string) {
	// 创建处理器
	auditHandler := handlers.NewAuditHandler(auditService)

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())

	// 健康检查路由
	r.GET("/health", auditHandler.Health)

	// API版本v1
	v1 := r.Group("/api/v1/audit")

	// 公开路由
	v1.POST("/stats", auditHandler.GetStatistics)
	v1.GET("/event-types", auditHandler.GetEventTypes)
	v1.GET("/service-names", auditHandler.GetServiceNames)

	// 需要认证的路由
	v1Auth := v1.Group("/")
	v1Auth.Use(middlewares.JWTAuthMiddleware(jwtSecret))
	{
		v1Auth.POST("/logs", auditHandler.ListAuditLogs)
		v1Auth.POST("/export", auditHandler.ExportAuditLogs)
	}
}
