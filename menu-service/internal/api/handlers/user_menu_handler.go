// internal/api/handlers/user_menu_handler.go
package handlers

import (
	"github.com/gin-gonic/gin"
	"menu-service/internal/services"
	"menu-service/internal/utils"
	"net/http"
)

// 请求结构体
type getUserMenuRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

// UserMenuHandler 用户菜单处理器
type UserMenuHandler struct {
	userMenuService services.UserMenuService
}

// NewUserMenuHandler 创建用户菜单处理器实例
func NewUserMenuHandler(userMenuService services.UserMenuService) *UserMenuHandler {
	return &UserMenuHandler{
		userMenuService: userMenuService,
	}
}

// GetUserMenu 获取用户菜单
func (h *UserMenuHandler) GetUserMenu(c *gin.Context) {
	var req getUserMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务获取用户菜单
	userMenu, err := h.userMenuService.GetUserMenu(req.UserID)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"items": userMenu,
	}))
}