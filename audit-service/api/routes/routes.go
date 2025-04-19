// audit-service/api/routes/routes.go 中添加以下代码
package routes

import (
	"github.com/gin-gonic/gin"

	"audit-service/api/handlers"
	"audit-service/api/middlewares"
	"audit-service/services"
)

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, auditService services.AuditService, edgeOneService services.EdgeOneLogService) {
	// 创建处理器
	auditHandler := handlers.NewAuditHandler(auditService)
	edgeOneHandler := handlers.NewEdgeOneHandler(edgeOneService)

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())

	// 健康检查路由
	r.GET("/health", auditHandler.Health)

	// API版本v1
	v1 := r.Group("/api/audit")

	// 所有审计日志路由
	v1.POST("/logs", auditHandler.ListAuditLogs)
	v1.POST("/export", auditHandler.ExportAuditLogs)
	v1.POST("/stats", auditHandler.GetStatistics)
	v1.GET("/event-types", auditHandler.GetEventTypes)
	v1.GET("/service-names", auditHandler.GetServiceNames)

	// EdgeOne日志路由
	edgeOne := v1.Group("/edgeone")
	{
		edgeOne.POST("/logs", edgeOneHandler.ListEdgeOneLogs)
		edgeOne.GET("/hosts", edgeOneHandler.GetEdgeOneHosts)
		edgeOne.POST("/stats", edgeOneHandler.GetEdgeOneStatistics)

		// EdgeOne日志推送接口
		webhook := edgeOne.Group("/webhook")
		{
			webhook.POST("/log", edgeOneHandler.ReceiveEdgeOneLog)   // 单条日志
			webhook.POST("/logs", edgeOneHandler.ReceiveEdgeOneLogs) // 批量日志
		}
	}
}