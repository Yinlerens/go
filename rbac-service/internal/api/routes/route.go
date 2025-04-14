// internal/api/routes/route.go
package routes

import (
	"rbac-service/internal/api/handlers"
	"rbac-service/internal/api/middlewares"
	"rbac-service/internal/config"
	"rbac-service/internal/repositories"
	"rbac-service/internal/services"
	"rbac-service/internal/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// VERSION 版本号
const VERSION = "v1.0.0"

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// 创建仓库
	roleRepo := repositories.NewRoleRepository(db)
	permRepo := repositories.NewPermissionRepository(db)
	userRoleRepo := repositories.NewUserRoleRepository(db)
	rolePermRepo := repositories.NewRolePermissionRepository(db)
	auditRepo := repositories.NewAuditLogRepository(db)
	cache := repositories.NewInMemoryCache()

	// 创建工具
	auditCreator := utils.NewAuditLogCreator()

	// 创建认证客户端
	authClient := services.NewAuthClient(cfg.AuthServiceURL, cfg.InternalAPIKeys["default"])

	// 创建服务
	roleService := services.NewRoleService(
		roleRepo,
		userRoleRepo,
		rolePermRepo,
		auditRepo,
		auditCreator,
	)

	permissionService := services.NewPermissionService(
		permRepo,
		rolePermRepo,
		auditRepo,
		auditCreator,
	)

	checkService := services.NewCheckService(
		userRoleRepo,
		rolePermRepo,
		permRepo,
		cache,
		cfg.CacheExpiry*time.Minute,
	)

	userRoleService := services.NewUserRoleService(
		userRoleRepo,
		roleRepo,
		auditRepo,
		auditCreator,
		authClient,
		checkService,
	)

	rolePermissionService := services.NewRolePermissionService(
		rolePermRepo,
		roleRepo,
		permRepo,
		userRoleRepo,
		auditRepo,
		auditCreator,
		checkService,
		cache,
	)

	auditLogService := services.NewAuditLogService(auditRepo)

	// 创建处理器
	roleHandler := handlers.NewRoleHandler(roleService)
	permissionHandler := handlers.NewPermissionHandler(permissionService)
	checkHandler := handlers.NewCheckHandler(checkService)
	userRoleHandler := handlers.NewUserRoleHandler(userRoleService)
	rolePermissionHandler := handlers.NewRolePermissionHandler(rolePermissionService)
	auditLogHandler := handlers.NewAuditLogHandler(auditLogService)
	healthHandler := handlers.NewHealthHandler(VERSION)

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())
	r.Use(middlewares.UserContext())
	auditLogger := middlewares.AuditLogger(auditRepo, auditCreator)
	// 健康检查路由
	r.GET("/health", healthHandler.Health)

	// API版本v1
	v1 := r.Group("/api/v1/rbac")

	// 权限检查路由 (需要内部API密钥认证)
	checkGroup := v1.Group("/")
	checkGroup.Use(middlewares.InternalAuth(cfg.InternalAPIKeys))
	checkGroup.Use(auditLogger)
	{
		checkGroup.POST("/check", checkHandler.CheckPermission)
		checkGroup.POST("/users/permissions", checkHandler.GetUserPermissions)
	}

	// 角色管理路由 (需要内部API密钥认证)
	roleGroup := v1.Group("/roles")
	roleGroup.Use(auditLogger)
	{
		roleGroup.POST("/create", roleHandler.CreateRole)
		roleGroup.POST("/list", roleHandler.ListRoles)
		roleGroup.POST("/update", roleHandler.UpdateRole)
		roleGroup.POST("/delete", roleHandler.DeleteRole)

		// 角色-权限管理
		roleGroup.POST("/assign-permission", rolePermissionHandler.AssignPermission)
		roleGroup.POST("/unassign-permission", rolePermissionHandler.UnassignPermission)
		roleGroup.POST("/permissions", rolePermissionHandler.GetRolePermissions)
	}

	// 权限管理路由 (需要内部API密钥认证)
	permGroup := v1.Group("/permissions")
	permGroup.Use(auditLogger)

	{
		permGroup.POST("/create", permissionHandler.CreatePermission)
		permGroup.POST("/list", permissionHandler.ListPermissions)
		permGroup.POST("/update", permissionHandler.UpdatePermission)
		permGroup.POST("/delete", permissionHandler.DeletePermission)
	}

	// 用户-角色管理路由 (需要内部API密钥认证)
	userGroup := v1.Group("/users")
	userGroup.Use(auditLogger)
	// userGroup.Use(middlewares.InternalAuth(cfg.InternalAPIKeys))
	{
		userGroup.POST("/assign-role", userRoleHandler.AssignRole)
		userGroup.POST("/unassign-role", userRoleHandler.UnassignRole)
		userGroup.POST("/roles", userRoleHandler.GetUserRoles)
		userGroup.POST("/batch-roles", userRoleHandler.GetBatchUserRoles)
	}

	// 审计日志路由 (需要内部API密钥认证)
	auditGroup := v1.Group("/audit-logs")
	{
		auditGroup.POST("/list", auditLogHandler.ListAuditLogs)
	}
}