package routes

import (
	"github.com/gin-gonic/gin"

	"audit-service/api/handlers"
	"audit-service/api/middlewares"
	"audit-service/services"
)

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, auditService services.AuditService) {
	// 创建处理器
	auditHandler := handlers.NewAuditHandler(auditService)

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())

	// 健康检查路由
	r.GET("/health", auditHandler.Health)

	// API版本v1
	v1 := r.Group("/api/v1/audit")

	// 所有路由都不需要JWT认证
	v1.POST("/logs", auditHandler.ListAuditLogs)
	v1.POST("/export", auditHandler.ExportAuditLogs)
	v1.POST("/stats", auditHandler.GetStatistics)
	v1.GET("/event-types", auditHandler.GetEventTypes)
	v1.GET("/service-names", auditHandler.GetServiceNames)
}