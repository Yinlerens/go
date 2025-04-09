// internal/api/handlers/audit_log_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
)

// 请求结构体
type listAuditLogsRequest struct {
	Page     int                    `json:"page"`
	PageSize int                    `json:"page_size"`
	Filters  map[string]interface{} `json:"filters"`
}

// AuditLogHandler 审计日志处理器
type AuditLogHandler struct {
	auditLogService services.AuditLogService
}

// NewAuditLogHandler 创建审计日志处理器实例
func NewAuditLogHandler(auditLogService services.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{
		auditLogService: auditLogService,
	}
}

// ListAuditLogs 获取审计日志列表
func (h *AuditLogHandler) ListAuditLogs(c *gin.Context) {
	var req listAuditLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 确保有效的分页参数
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	// 调用服务获取审计日志
	logs, total, err := h.auditLogService.GetAuditLogs(req.Page, req.PageSize, req.Filters)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, nil))
		return
	}

	// 转换为响应格式
	logList := make([]map[string]interface{}, len(logs))
	for i, log := range logs {
		logList[i] = map[string]interface{}{
			"id":            log.ID,
			"timestamp":     log.Timestamp,
			"actor_id":      log.ActorID,
			"actor_type":    log.ActorType,
			"action":        log.Action,
			"target_type":   log.TargetType,
			"target_key":    log.TargetKey,
			"details":       log.Details,
			"status":        log.Status,
			"error_message": log.ErrorMessage,
		}
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  logList,
		"total": total,
	}))
}
