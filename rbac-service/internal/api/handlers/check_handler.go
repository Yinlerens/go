// internal/api/handlers/check_handler.go

package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
)

// CheckHandler 权限检查处理器
type CheckHandler struct {
	checkService services.CheckService
}

// 请求结构体
type checkPermissionRequest struct {
	UserID        string `json:"user_id" binding:"required"`
	PermissionKey string `json:"permission_key" binding:"required"`
}

type getUserPermissionsRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Type   string `json:"type"`
}

// NewCheckHandler 创建权限检查处理器实例
func NewCheckHandler(checkService services.CheckService) *CheckHandler {
	return &CheckHandler{
		checkService: checkService,
	}
}

// CheckPermission 检查用户权限
func (h *CheckHandler) CheckPermission(c *gin.Context) {
	var req checkPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务检查权限
	allowed, err := h.checkService.CheckPermission(req.UserID, req.PermissionKey)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, err.Error()))
		return
	}

	// 返回成功响应
	var msg string
	if allowed {
		msg = "允许访问"
	} else {
		msg = "权限不足"
	}

	c.JSON(http.StatusOK, utils.Response{
		Code: utils.CodeSuccess,
		Msg:  msg,
		Data: gin.H{
			"allowed": allowed,
		},
	})
}

// GetUserPermissions 获取用户所有权限
func (h *CheckHandler) GetUserPermissions(c *gin.Context) {
	var req getUserPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务获取用户权限
	permissions, err := h.checkService.GetUserPermissions(req.UserID, req.Type)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"permissions": permissions,
	}))
}