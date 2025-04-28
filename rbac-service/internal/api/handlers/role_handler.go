// internal/api/handlers/role_handler.go

package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
	"strings"
)

// RoleHandler 角色处理器
type RoleHandler struct {
	roleService services.RoleService
}

// 请求结构体
type createRoleRequest struct {
	RoleKey     string `json:"role_key" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type updateRoleRequest struct {
	RoleKey     string `json:"role_key" binding:"required"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type deleteRoleRequest struct {
	RoleKey string `json:"role_key" binding:"required"`
}

type listRolesRequest struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
}

// NewRoleHandler 创建角色处理器实例
func NewRoleHandler(roleService services.RoleService) *RoleHandler {
	return &RoleHandler{
		roleService: roleService,
	}
}

// CreateRole 创建角色
func (h *RoleHandler) CreateRole(c *gin.Context) {
	var req createRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务创建角色
	role, err := h.roleService.CreateRole(req.RoleKey, req.Name, req.Description)
	if err != nil {
		code := utils.CodeInternalError
		switch err.Error() {
		case "角色Key格式无效":
			code = utils.CodeInvalidParams
		case "角色Key已存在":
			code = utils.CodeRoleExists
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"role_key":    role.RoleKey,
		"name":        role.Name,
		"description": role.Description,
	}))
}

// ListRoles 获取角色列表
func (h *RoleHandler) ListRoles(c *gin.Context) {
	var req listRolesRequest
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

	// 调用服务获取角色列表
	roles, total, err := h.roleService.GetRoles(req.Page, req.PageSize)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalError, nil))
		return
	}

	// 转换为响应格式
	roleList := make([]map[string]interface{}, len(roles))
	for i, role := range roles {
		roleList[i] = map[string]interface{}{
			"role_key":    role.RoleKey,
			"name":        role.Name,
			"description": role.Description,
		}
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  roleList,
		"total": total,
	}))
}

// UpdateRole 更新角色
func (h *RoleHandler) UpdateRole(c *gin.Context) {
	var req updateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}

	// 调用服务更新角色
	err := h.roleService.UpdateRole(req.RoleKey, req.Name, req.Description)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "角色不存在") {
			code = utils.CodeRoleNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// DeleteRole 删除角色
func (h *RoleHandler) DeleteRole(c *gin.Context) {
	var req deleteRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, err.Error()))
		return
	}
	// 调用服务删除角色
	err := h.roleService.DeleteRole(req.RoleKey)
	if err != nil {
		code := utils.CodeInternalError
		if strings.Contains(err.Error(), "角色不存在") {
			code = utils.CodeRoleNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, err.Error()))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}