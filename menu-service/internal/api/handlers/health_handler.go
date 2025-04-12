// internal/api/handlers/health_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// HealthHandler 健康检查处理器
type HealthHandler struct {
	version string
}

// NewHealthHandler 创建健康检查处理器实例
func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{
		version: version,
	}
}

// Health 健康检查
func (h *HealthHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "menu-service",
		"version": h.version,
	})
}