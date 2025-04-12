// internal/api/handlers/menu_item_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"menu-service/internal/models"
	"menu-service/internal/services"
	"menu-service/internal/utils"
	"net/http"
	"strings"
)

// 请求结构体
type createMenuItemRequest struct {
	Name          string      `json:"name" binding:"required"`
	Path          string      `json:"path" binding:"required"`
	Icon          string      `json:"icon"`
	PermissionKey string      `json:"permission_key"`
	ParentID      string      `json:"parent_id"`
	Order         int         `json:"order"`
	IsEnabled     bool        `json:"is_enabled"`
	Meta          models.JSON `json:"meta"`
}

type updateMenuItemRequest struct {
	ID            string      `json:"id" binding:"required"`
	Name          string      `json:"name" binding:"required"`
	Path          string      `json:"path" binding:"required"`
	Icon          string      `json:"icon"`
	PermissionKey string      `json:"permission_key"`
	ParentID      string      `json:"parent_id"`
	Order         int         `json:"order"`
	IsEnabled     bool        `json:"is_enabled"`
	Meta          models.JSON `json:"meta"`
}

type deleteMenuItemRequest struct {
	ID string `json:"id" binding:"required"`
}

type updateMenuPermissionRequest struct {
	ID            string `json:"id" binding:"required"`
	PermissionKey string `json:"permission_key"`
}

// MenuItemHandler 菜单项处理器
type MenuItemHandler struct {
	menuItemService services.MenuItemService
}

// NewMenuItemHandler 创建菜单项处理器实例
func NewMenuItemHandler(menuItemService services.MenuItemService) *MenuItemHandler {
	return &MenuItemHandler{
		menuItemService: menuItemService,
	}
}

// CreateMenuItem 创建菜单项
func (h *MenuItemHandler) CreateMenuItem(c *gin.Context) {
	var req createMenuItemRequest
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

	// 调用服务创建菜单项
	menuItem, err := h.menuItemService.CreateMenuItem(
		req.Name,
		req.Path,
		req.Icon,
		req.PermissionKey,
		req.ParentID,
		req.Order,
		req.IsEnabled,
		req.Meta,
		actorID,
		actorType,
	)
	if err != nil {
		code := utils.CodeInternalServerError
		switch {
		case strings.Contains(err.Error(), "菜单路径格式无效"):
			code = utils.CodeInvalidParams
		case strings.Contains(err.Error(), "菜单路径已存在"):
			code = utils.CodeMenuItemExists
		case strings.Contains(err.Error(), "父菜单不存在"):
			code = utils.CodeParentMenuNotFound
		case strings.Contains(err.Error(), "权限标识不存在"):
			code = utils.CodePermissionNotFound
		case strings.Contains(err.Error(), "菜单层级超出限制"):
			code = utils.CodeMenuLevelExceeded
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"id":             menuItem.ID,
		"name":           menuItem.Name,
		"path":           menuItem.Path,
		"icon":           menuItem.Icon,
		"permission_key": menuItem.PermissionKey,
		"parent_id":      menuItem.ParentID,
		"order":          menuItem.Order,
		"is_enabled":     menuItem.IsEnabled,
		"meta":           menuItem.Meta,
	}))
}

// GetMenuTree 获取菜单树
func (h *MenuItemHandler) GetMenuTree(c *gin.Context) {
	// 调用服务获取菜单树
	menuTree, err := h.menuItemService.GetMenuTree()
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"items": menuTree,
	}))
}

// UpdateMenuItem 更新菜单项
func (h *MenuItemHandler) UpdateMenuItem(c *gin.Context) {
	var req updateMenuItemRequest
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

	// 调用服务更新菜单项
	err := h.menuItemService.UpdateMenuItem(
		req.ID,
		req.Name,
		req.Path,
		req.Icon,
		req.PermissionKey,
		req.ParentID,
		req.Order,
		req.IsEnabled,
		req.Meta,
		actorID,
		actorType,
	)
	if err != nil {
		code := utils.CodeInternalServerError
		switch {
		case strings.Contains(err.Error(), "菜单项不存在"):
			code = utils.CodeMenuItemNotFound
		case strings.Contains(err.Error(), "菜单路径格式无效"):
			code = utils.CodeInvalidParams
		case strings.Contains(err.Error(), "菜单路径已存在"):
			code = utils.CodeMenuItemExists
		case strings.Contains(err.Error(), "父菜单不存在"):
			code = utils.CodeParentMenuNotFound
		case strings.Contains(err.Error(), "权限标识不存在"):
			code = utils.CodePermissionNotFound
		case strings.Contains(err.Error(), "菜单层级超出限制"):
			code = utils.CodeMenuLevelExceeded
		case strings.Contains(err.Error(), "排序冲突"):
			code = utils.CodeOrderConflict
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// DeleteMenuItem 删除菜单项
func (h *MenuItemHandler) DeleteMenuItem(c *gin.Context) {
	var req deleteMenuItemRequest
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

	// 调用服务删除菜单项
	err := h.menuItemService.DeleteMenuItem(req.ID, actorID, actorType)
	if err != nil {
		code := utils.CodeInternalServerError
		switch {
		case strings.Contains(err.Error(), "菜单项不存在"):
			code = utils.CodeMenuItemNotFound
		case strings.Contains(err.Error(), "存在子菜单"):
			code = utils.CodeHasChildrenMenu
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

// UpdateMenuPermission 更新菜单权限
func (h *MenuItemHandler) UpdateMenuPermission(c *gin.Context) {
	var req updateMenuPermissionRequest
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

	// 调用服务更新菜单权限
	err := h.menuItemService.UpdateMenuPermission(req.ID, req.PermissionKey, actorID, actorType)
	if err != nil {
		code := utils.CodeInternalServerError
		switch {
		case strings.Contains(err.Error(), "菜单项不存在"):
			code = utils.CodeMenuItemNotFound
		case strings.Contains(err.Error(), "权限标识不存在"):
			code = utils.CodePermissionNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}