// internal/api/handlers/role_permission_handler.go

package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
	"strings"
)

// RolePermissionHandler 角色-权限处理器
type RolePermissionHandler struct {
	rolePermissionService services.RolePermissionService
}

// 请求结构体
type assignPermissionRequest struct {
	RoleKey        string   `json:"role_key" binding:"required"`
	PermissionKeys []string `json:"permission_keys" binding:"required"`
}

type unassignPermissionRequest struct {
	RoleKey        string   `json:"role_key" binding:"required"`
	PermissionKeys []string `json:"permission_keys" binding:"required"`
}

type getRolePermissionsRequest struct {
	RoleKey string `json:"role_key" binding:"required"`
}

// NewRolePermissionHandler 创建角色-权限处理器实例
func NewRolePermissionHandler(rolePermissionService services.RolePermissionService) *RolePermissionHandler {
	return &RolePermissionHandler{
		rolePermissionService: rolePermissionService,
	}
}

// AssignPermission 给角色分配权限
func (h *RolePermissionHandler) AssignPermission(c *gin.Context) {
	var req assignPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务分配权限
	err := h.rolePermissionService.AssignPermissionsToRole(req.RoleKey, req.PermissionKeys)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "角色不存在") {
			code = utils.CodeRoleNotFound
		} else if strings.Contains(err.Error(), "权限不存在") {
			code = utils.CodePermissionNotFound
		} else if strings.Contains(err.Error(), "角色已拥有该权限") {
			code = utils.CodeRolePermExists
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// UnassignPermission 解除角色权限
func (h *RolePermissionHandler) UnassignPermission(c *gin.Context) {
	var req unassignPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务解除权限
	err := h.rolePermissionService.UnassignPermissionsFromRole(req.RoleKey, req.PermissionKeys)
	if err != nil {
		code := utils.CodeInternalError
		c.JSON(http.StatusOK, utils.NewResponse(code, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// GetRolePermissions 获取角色的所有权限
func (h *RolePermissionHandler) GetRolePermissions(c *gin.Context) {
	var req getRolePermissionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务获取角色权限
	permissions, err := h.rolePermissionService.GetRolePermissions(req.RoleKey)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "角色不存在") {
			code = utils.CodeRoleNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"permissions": permissions,
	}))
}