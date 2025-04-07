// internal/api/handlers/user_handler.go
package handlers

import (
	"auth-service/internal/services"
	"auth-service/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
)

// 请求结构体
type updateStatusRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Status string `json:"status" binding:"required"`
}

// UserHandler 用户处理器
type UserHandler struct {
	userService services.UserService
}

// NewUserHandler 创建用户处理器实例
func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// UpdateStatus 更新用户状态
func (h *UserHandler) UpdateStatus(c *gin.Context) {
	var req updateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 验证状态值
	if req.Status != "active" && req.Status != "inactive" {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务更新状态
	err := h.userService.UpdateUserStatus(req.UserID, req.Status)
	if err != nil {
		code := utils.CodeInternalServerError
		switch {
		case strings.Contains(err.Error(), "无效的状态值"):
			code = utils.CodeInvalidParams
		case strings.Contains(err.Error(), "目标用户不存在"):
			code = utils.CodeResourceNotFound
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}
