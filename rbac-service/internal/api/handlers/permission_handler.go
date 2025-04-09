// internal/api/handlers/permission_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
	"strings"
)

// 请求结构体
type createPermissionRequest struct {
	PermissionKey string `json:"permission_key" binding:"required"`
	Name          string `json:"name" binding:"required"`
	Type          string `json:"type" binding:"required"`
	Description   string `json:"description"`
}

type updatePermissionRequest struct {
	PermissionKey string `json:"permission_key" binding:"required"`
	Name          string `json:"name"`
	Type          string `json:"type"`
	Description   string `json:"description"`
}

type deletePermissionRequest struct {
	PermissionKey string `json:"permission_key" binding:"required"`
}

type listPermissionsRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Type     string `json:"type"`
}

// PermissionHandler 权限处理器
type PermissionHandler struct {
	permissionService services.PermissionService
}

// NewPermissionHandler 创建权限处理器实例
func NewPermissionHandler(permissionService services.PermissionService) *PermissionHandler {
	return &PermissionHandler{
		permissionService: permissionService,
	}
}

// CreatePermission 创建权限
func (h *PermissionHandler) CreatePermission(c *gin.Context) {
	var req createPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 获取调用者信息
	actorID := c.GetString("caller_id")
	if actorID == "" {
		actorID = "system"
	}
	actorType := c.GetString("caller_type")
	if actorType == "" {
		actorType = "SERVICE"
	}

	// 调用服务创建权限
	permission, err := h.permissionService.CreatePermission(req.PermissionKey, req.Name, req.Type, req.Description, actorID, actorType)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "权限Key已存在") {
			code = utils.CodePermissionExists
		} else if strings.Contains(err.Error(), "权限Key格式无效") {
			code = utils.CodeInvalidParams
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"permission_key": permission.PermissionKey,
		"name":           permission.Name,
		"type":           permission.Type,
		"description":    permission.Description,
	}))
}

// ListPermissions 获取权限列表
func (h *PermissionHandler) ListPermissions(c *gin.Context) {
	var req listPermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 使用默认分页参数
		req.Page = 1
		req.PageSize = 10
	}

	// 确保有效的分页参数
	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 10
	}

	// 调用服务获取权限列表
	permissions, total, err := h.permissionService.GetPermissions(req.Page, req.PageSize, req.Type)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, nil))
		return
	}

	// 转换为响应格式
	permList := make([]map[string]interface{}, len(permissions))
	for i, perm := range permissions {
		permList[i] = map[string]interface{}{
			"permission_key": perm.PermissionKey,
			"name":           perm.Name,
			"type":           perm.Type,
			"description":    perm.Description,
		}
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  permList,
		"total": total,
	}))
}

// UpdatePermission 更新权限
func (h *PermissionHandler) UpdatePermission(c *gin.Context) {
	var req updatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 获取调用者信息
	actorID := c.GetString("caller_id")
	if actorID == "" {
		actorID = "system"
	}
	actorType := c.GetString("caller_type")
	if actorType == "" {
		actorType = "SERVICE"
	}

	// 调用服务更新权限
	err := h.permissionService.UpdatePermission(req.PermissionKey, req.Name, req.Type, req.Description, actorID, actorType)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "权限不存在") {
			code = utils.CodePermissionNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// DeletePermission 删除权限
func (h *PermissionHandler) DeletePermission(c *gin.Context) {
	var req deletePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 获取调用者信息
	actorID := c.GetString("caller_id")
	if actorID == "" {
		actorID = "system"
	}
	actorType := c.GetString("caller_type")
	if actorType == "" {
		actorType = "SERVICE"
	}

	// 调用服务删除权限
	err := h.permissionService.DeletePermission(req.PermissionKey, actorID, actorType)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "权限不存在") {
			code = utils.CodePermissionNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}
