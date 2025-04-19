// audit-service/api/handlers/edgeone_handler.go
package handlers

import (
	"audit-service/models"
	"audit-service/services"
	"audit-service/utils"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 请求结构体
type listEdgeOneLogsRequest struct {
	StartTime              string `json:"start_time"`
	EndTime                string `json:"end_time"`
	RequestID              string `json:"request_id"`
	ClientIP               string `json:"client_ip"`
	ClientRegion           string `json:"client_region"`
	RequestHost            string `json:"request_host"`
	RequestMethod          string `json:"request_method"`
	RequestUrl             string `json:"request_url"`
	EdgeResponseStatusCode int    `json:"edge_response_status_code"`
	SecurityAction         string `json:"security_action"`
	BotTag                 string `json:"bot_tag"`
	Page                   int    `json:"page"`
	PageSize               int    `json:"page_size"`
}

type getEdgeOneStatisticsRequest struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// EdgeOneHandler EdgeOne日志处理器
type EdgeOneHandler struct {
	edgeOneService services.EdgeOneLogService
}

// NewEdgeOneHandler 创建EdgeOne日志处理器实例
func NewEdgeOneHandler(edgeOneService services.EdgeOneLogService) *EdgeOneHandler {
	return &EdgeOneHandler{
		edgeOneService: edgeOneService,
	}
}

// ListEdgeOneLogs 获取EdgeOne日志列表
func (h *EdgeOneHandler) ListEdgeOneLogs(c *gin.Context) {
	var req listEdgeOneLogsRequest
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
	}

	if req.EndTime != "" {
		endTime, err = time.Parse(time.RFC3339, req.EndTime)
		if err != nil {
			c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
			return
		}
	}

	// 构建查询条件
	filter := services.EdgeOneLogFilter{
		StartTime:              startTime,
		EndTime:                endTime,
		RequestID:              req.RequestID,
		ClientIP:               req.ClientIP,
		ClientRegion:           req.ClientRegion,
		RequestHost:            req.RequestHost,
		RequestMethod:          req.RequestMethod,
		RequestUrl:             req.RequestUrl,
		EdgeResponseStatusCode: req.EdgeResponseStatusCode,
		SecurityAction:         req.SecurityAction,
		BotTag:                 req.BotTag,
	}

	// 调用服务获取日志
	logs, total, err := h.edgeOneService.GetLogs(filter, req.Page, req.PageSize)
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

// GetEdgeOneHosts 获取EdgeOne Host列表
func (h *EdgeOneHandler) GetEdgeOneHosts(c *gin.Context) {
	hosts, err := h.edgeOneService.GetHosts()
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"hosts": hosts,
	}))
}

// GetEdgeOneStatistics 获取EdgeOne统计信息
func (h *EdgeOneHandler) GetEdgeOneStatistics(c *gin.Context) {
	var req getEdgeOneStatisticsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 使用默认参数
		req.StartTime = time.Now().AddDate(0, 0, -7).Format(time.RFC3339)
		req.EndTime = time.Now().Format(time.RFC3339)
	}

	// 转换时间格式
	startTime, _ := time.Parse(time.RFC3339, req.StartTime)
	endTime, _ := time.Parse(time.RFC3339, req.EndTime)

	// 构建查询条件
	filter := services.EdgeOneLogFilter{
		StartTime: startTime,
		EndTime:   endTime,
	}

	// 调用服务获取统计信息
	stats, err := h.edgeOneService.GetStatistics(filter)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, stats))
}

// ReceiveEdgeOneLog 接收EdgeOne推送的日志
func (h *EdgeOneHandler) ReceiveEdgeOneLog(c *gin.Context) {
	var logEntry models.EdgeOneLogEntry
	if err := c.ShouldBindJSON(&logEntry); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}
	// 添加生产日志
	log.Printf("已收到腾讯云推送: RequestID=%s, Host=%s, ClientIP=%s",
		logEntry.RequestID, logEntry.RequestHost, logEntry.ClientIP)
	// 调用服务保存日志
	if err := h.edgeOneService.SaveLog(&logEntry); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// ReceiveEdgeOneLogs 批量接收EdgeOne推送的日志
func (h *EdgeOneHandler) ReceiveEdgeOneLogs(c *gin.Context) {
	var logs []models.EdgeOneLogEntry
	if err := c.ShouldBindJSON(&logs); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 批量保存日志
	for _, log := range logs {
		// 复制一份，避免引用问题
		logCopy := log
		if err := h.edgeOneService.SaveLog(&logCopy); err != nil {
			// 这里只记录错误但继续处理其他日志
			continue
		}
	}

	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"processed": len(logs),
	}))
}