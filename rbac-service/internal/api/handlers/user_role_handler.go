// internal/api/handlers/user_role_handler.go

package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
	"strings"
)

// UserRoleHandler 用户-角色处理器
type UserRoleHandler struct {
	userRoleService services.UserRoleService
}

// 请求结构体
type assignRoleRequest struct {
	UserID   string   `json:"user_id" binding:"required"`
	RoleKeys []string `json:"role_keys" binding:"required"`
}

type unassignRoleRequest struct {
	UserID   string   `json:"user_id" binding:"required"`
	RoleKeys []string `json:"role_keys" binding:"required"`
}

type getUserRolesRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

// UserRoleHandler 用户-角色处理器
type getBatchUserRolesRequest struct {
	UserIDs []string `json:"user_ids" binding:"required"`
}

// NewUserRoleHandler 创建用户-角色处理器实例
func NewUserRoleHandler(userRoleService services.UserRoleService) *UserRoleHandler {
	return &UserRoleHandler{
		userRoleService: userRoleService,
	}
}

// AssignRole 给用户分配角色
func (h *UserRoleHandler) AssignRole(c *gin.Context) {
	var req assignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}
	// 调用服务分配角色
	err := h.userRoleService.AssignRolesToUser(req.UserID, req.RoleKeys)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "用户不存在或无效") {
			code = utils.CodeUserInvalid
		} else if strings.Contains(err.Error(), "角色不存在") {
			code = utils.CodeRoleNotFound
		} else if strings.Contains(err.Error(), "用户已拥有该角色") {
			code = utils.CodeUserRoleExists
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// UnassignRole 解除用户角色
func (h *UserRoleHandler) UnassignRole(c *gin.Context) {
	var req unassignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务解除角色
	err := h.userRoleService.UnassignRolesFromUser(req.UserID, req.RoleKeys)
	if err != nil {
		code := utils.CodeInternalError
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// GetUserRoles 获取用户的所有角色
func (h *UserRoleHandler) GetUserRoles(c *gin.Context) {
	var req getUserRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务获取用户角色
	roles, err := h.userRoleService.GetUserRoles(req.UserID)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"roles": roles,
	}))
}

// GetBatchUserRoles 批量获取多个用户的角色
func (h *UserRoleHandler) GetBatchUserRoles(c *gin.Context) {
	var req getBatchUserRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务批量获取用户角色
	rolesMap, err := h.userRoleService.GetBatchUserRoles(req.UserIDs)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"user_roles": rolesMap,
	}))
}