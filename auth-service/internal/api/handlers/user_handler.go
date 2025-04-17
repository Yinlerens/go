package handlers

import (
	"auth-service/internal/services"
	"auth-service/internal/utils"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"

	"github.com/Yinlerens/audit-sdk/client"
)

type updateStatusRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Status string `json:"status" binding:"required"`
}
type listUsersRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Username string `json:"username"`
}
type validateUserRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

// UserHandler 用户处理器
type UserHandler struct {
	userService services.UserService
	auditClient client.Client // 添加审计客户端
}

// NewUserHandler 创建用户处理器实例
func NewUserHandler(userService services.UserService, auditClient client.Client) *UserHandler {
	return &UserHandler{
		userService: userService,
		auditClient: auditClient,
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

		// 记录失败审计
		h.auditClient.LogWithContext(
			c,
			client.EventUserStatusChange,
			client.ResultFailure,
			map[string]interface{}{
				"target_user_id": req.UserID,
				"new_status":     req.Status,
				"error_code":     code,
				"error_message":  err.Error(),
			},
		)

		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 记录成功审计
	h.auditClient.LogWithContext(
		c,
		client.EventUserStatusChange,
		client.ResultSuccess,
		map[string]interface{}{
			"target_user_id": req.UserID,
			"new_status":     req.Status,
		},
	)

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, nil))
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	var req listUsersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Use default values for pagination if not provided
		if req.Page <= 0 {
			req.Page = 1
		}
		if req.PageSize <= 0 || req.PageSize > 100 {
			req.PageSize = 10
		}
	}

	// Call service to get users
	users, total, err := h.userService.GetUsers(req.Page, req.PageSize, req.Username)
	if err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInternalServerError, nil))
		return
	}

	// Transform to response format (exclude sensitive data)
	userList := make([]map[string]interface{}, len(users))
	for i, user := range users {
		userList[i] = map[string]interface{}{
			"user_id":    user.UserID,
			"username":   user.Username,
			"status":     user.Status,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		}
	}

	// Return success response
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"list":  userList,
		"total": total,
	}))
}

// ValidateUser 验证用户是否存在且状态为active
func (h *UserHandler) ValidateUser(c *gin.Context) {
	var req validateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, utils.NewResponse(utils.CodeInvalidParams, nil))
		return
	}

	// 调用服务验证用户
	valid, err := h.userService.ValidateUser(req.UserID)
	if err != nil {
		code := utils.CodeUserNotFound
		if strings.Contains(err.Error(), "用户状态非active") {
			code = utils.CodeUserInactive
		}
		c.JSON(http.StatusOK, utils.NewResponse(code, nil))
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, utils.NewResponse(utils.CodeSuccess, gin.H{
		"valid": valid,
	}))
}