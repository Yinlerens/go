package controllers

import (
	"net/http"
	"strconv"

	"back/models"
	"back/services"
	"back/utils/response"
	"github.com/gin-gonic/gin"
)

// UserController 用户控制器
type UserController struct {
	userService *services.UserService
}

// NewUserController 创建用户控制器实例
func NewUserController(userService *services.UserService) *UserController {
	return &UserController{userService: userService}
}

// Register 注册用户控制器路由
func (c *UserController) Register(router *gin.RouterGroup) {
	userRouter := router.Group("/users")
	{
		userRouter.GET("/", c.GetUsers)         // 获取用户列表
		userRouter.GET("/:id", c.GetUser)       // 获取单个用户
		userRouter.POST("/", c.CreateUser)      // 创建用户
		userRouter.PUT("/:id", c.UpdateUser)    // 更新用户
		userRouter.DELETE("/:id", c.DeleteUser) // 删除用户
	}
}

// GetUsers 获取用户列表
// @Summary 获取用户列表
// @Description 获取所有用户的列表
// @Tags 用户管理
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]models.User}
// @Router /api/v1/users [get]
func (c *UserController) GetUsers(ctx *gin.Context) {
	users, err := c.userService.GetUsers()
	if err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "获取用户列表失败", err.Error())
		return
	}
	response.Success(ctx, "获取用户列表成功", users)
}

// GetUser 获取单个用户
// @Summary 获取单个用户
// @Description 根据ID获取用户信息
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response{data=models.User}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/users/{id} [get]
func (c *UserController) GetUser(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的用户ID", err.Error())
		return
	}

	user, err := c.userService.GetUserByID(uint(id))
	if err != nil {
		response.Fail(ctx, http.StatusNotFound, "用户不存在", err.Error())
		return
	}

	response.Success(ctx, "获取用户成功", user)
}

// CreateUser 创建用户
// @Summary 创建新用户
// @Description 创建一个新的用户
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param user body models.User true "用户信息"
// @Success 201 {object} response.Response{data=models.User}
// @Failure 400 {object} response.Response
// @Router /api/v1/users [post]
func (c *UserController) CreateUser(ctx *gin.Context) {
	var user models.User
	if err := ctx.ShouldBindJSON(&user); err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的请求数据", err.Error())
		return
	}

	if err := c.userService.CreateUser(&user); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "创建用户失败", err.Error())
		return
	}

	response.Success(ctx, "创建用户成功", user)
}

// UpdateUser 更新用户
// @Summary 更新用户
// @Description 根据ID更新用户信息
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Param user body models.User true "用户信息"
// @Success 200 {object} response.Response{data=models.User}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/users/{id} [put]
func (c *UserController) UpdateUser(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的用户ID", err.Error())
		return
	}

	var user models.User
	if err := ctx.ShouldBindJSON(&user); err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的请求数据", err.Error())
		return
	}

	user.ID = uint(id)
	if err := c.userService.UpdateUser(&user); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "更新用户失败", err.Error())
		return
	}

	response.Success(ctx, "更新用户成功", user)
}

// DeleteUser 删除用户
// @Summary 删除用户
// @Description 根据ID删除用户
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/users/{id} [delete]
func (c *UserController) DeleteUser(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的用户ID", err.Error())
		return
	}

	if err := c.userService.DeleteUser(uint(id)); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "删除用户失败", err.Error())
		return
	}

	response.Success(ctx, "删除用户成功", nil)
}
