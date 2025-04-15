package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"audit-service/services"
	"audit-service/utils"
)

// 请求结构体
type listAuditLogsRequest struct {
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	EventType    string `json:"event_type"`
	ServiceName  string `json:"service_name"`
	Result       string `json:"result"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	ClientIP     string `json:"client_ip"`
	Page         int    `json:"page"`
	PageSize     int    `json:"page_size"`
}

type exportAuditLogsRequest struct {
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	UserID      string `json:"user_id"`
	Username    string `json:"username"`
	EventType   string `json:"event_type"`
	ServiceName string `json:"service_name"`
	Result      string `json:"result"`
	Format      string `json:"format"` // csv, excel
}

type getStatisticsRequest struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// AuditHandler 审计日志处理器
type AuditHandler struct {
	auditService services.AuditService
}

// NewAuditHandler 创建审计日志处理器实例
func NewAuditHandler(auditService services.AuditService) *AuditHandler {
	return &AuditHandler{
		auditService: auditService,
	}
}

// ListAuditLogs 获取审计日志列表
func (h *AuditHandler) ListAuditLogs(c *gin.Context) {
	var req listAuditLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 设置默认分页参数
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	// 转换时间格式
	var startTime, endTime time.Time
	var err error

	if req.StartTime != "" {
		startTime, err = time.Parse(time.RFC3339, req.StartTime)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
			return
		}
	} else {
		// 默认查询最近7天
		startTime = time.Now().AddDate(0, 0, -7)
	}

	if req.EndTime != "" {
		endTime, err = time.Parse(time.RFC3339, req.EndTime)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
			return
		}
	} else {
		endTime = time.Now()
	}

	// 构建查询条件
	filter := services.AuditLogFilter{
		StartTime:    startTime,
		EndTime:      endTime,
		UserID:       req.UserID,
		Username:     req.Username,
		EventType:    req.EventType,
		ServiceName:  req.ServiceName,
		Result:       req.Result,
		ResourceType: req.ResourceType,
		ResourceID:   req.ResourceID,
		ClientIP:     req.ClientIP,
	}

	// 调用服务获取日志
	logs, total, err := h.auditService.GetAuditLogs(filter, req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  logs,
		"total": total,
	}))
}

// ExportAuditLogs 导出审计日志
func (h *AuditHandler) ExportAuditLogs(c *gin.Context) {
	var req exportAuditLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 转换时间格式
	var startTime, endTime time.Time
	var err error

	if req.StartTime != "" {
		startTime, err = time.Parse(time.RFC3339, req.StartTime)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
			return
		}
	} else {
		// 默认导出最近30天
		startTime = time.Now().AddDate(0, 0, -30)
	}

	if req.EndTime != "" {
		endTime, err = time.Parse(time.RFC3339, req.EndTime)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
			return
		}
	} else {
		endTime = time.Now()
	}

	// 构建查询条件
	filter := services.AuditLogFilter{
		StartTime:   startTime,
		EndTime:     endTime,
		UserID:      req.UserID,
		Username:    req.Username,
		EventType:   req.EventType,
		ServiceName: req.ServiceName,
		Result:      req.Result,
	}

	// 设置默认导出格式
	if req.Format == "" {
		req.Format = "csv"
	}

	// 调用服务导出日志
	fileData, fileName, err := h.auditService.ExportAuditLogs(filter, req.Format)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// 设置响应头
	contentType := "text/csv"
	if req.Format == "excel" {
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
	c.Data(http.StatusOK, contentType, fileData)
}

// GetEventTypes 获取事件类型列表
func (h *AuditHandler) GetEventTypes(c *gin.Context) {
	eventTypes, err := h.auditService.GetEventTypes()
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"event_types": eventTypes,
	}))
}

// GetServiceNames 获取服务名列表
func (h *AuditHandler) GetServiceNames(c *gin.Context) {
	serviceNames, err := h.auditService.GetServiceNames()
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"service_names": serviceNames,
	}))
}

// GetStatistics 获取审计统计信息
func (h *AuditHandler) GetStatistics(c *gin.Context) {
	var req getStatisticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 使用默认参数
		req.StartTime = time.Now().AddDate(0, 0, -30).Format(time.RFC3339)
		req.EndTime = time.Now().Format(time.RFC3339)
	}

	// 转换时间格式
	startTime, _ := time.Parse(time.RFC3339, req.StartTime)
	endTime, _ := time.Parse(time.RFC3339, req.EndTime)

	// 构建查询条件
	filter := services.AuditLogFilter{
		StartTime: startTime,
		EndTime:   endTime,
	}

	// 调用服务获取统计信息
	stats, err := h.auditService.GetStatistics(filter)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, stats))
}

// Health 健康检查
func (h *AuditHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "audit-service",
		"version": "v1.0.0",
	})
}
