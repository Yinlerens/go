// internal/api/handlers/menu_log_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"menu-service/internal/services"
	"menu-service/internal/utils"
	"net/http"
)

// 请求结构体
type listMenuLogsRequest struct {
	Page     int                    `json:"page"`
	PageSize int                    `json:"page_size"`
	Filters  map[string]interface{} `json:"filters"`
}

// MenuLogHandler 菜单变更日志处理器
type MenuLogHandler struct {
	menuLogService services.MenuLogService
}

// NewMenuLogHandler 创建菜单变更日志处理器实例
func NewMenuLogHandler(menuLogService services.MenuLogService) *MenuLogHandler {
	return &MenuLogHandler{
		menuLogService: menuLogService,
	}
}

// ListMenuLogs 获取菜单变更日志列表
func (h *MenuLogHandler) ListMenuLogs(c *gin.Context) {
	var req listMenuLogsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 确保有效的分页参数
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 20
	}

	// 调用服务获取菜单变更日志
	logs, total, err := h.menuLogService.GetMenuLogs(req.Page, req.PageSize, req.Filters)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, err.Error()))
		return
	}

	// 转换为响应格式
	logList := make([]map[string]interface{}, len(logs))
	for i, log := range logs {
		logList[i] = map[string]interface{}{
			"id":            log.ID,
			"menu_id":       log.MenuID,
			"action":        log.Action,
			"operator_id":   log.OperatorID,
			"operator_type": log.OperatorType,
			"before_change": log.BeforeChange,
			"after_change":  log.AfterChange,
			"created_at":    log.CreatedAt,
		}
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  logList,
		"total": total,
	}))
}