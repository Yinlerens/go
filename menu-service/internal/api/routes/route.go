package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"
	"menu-service/internal/api/handlers"
	"menu-service/internal/api/middlewares"
	"menu-service/internal/config"
	"menu-service/internal/repositories"
	"menu-service/internal/services"
	"menu-service/internal/utils"
	"time"

	"github.com/Yinlerens/audit-sdk/client"
	"github.com/Yinlerens/audit-sdk/middleware"
)

// VERSION 版本号
const VERSION = "v1.0.0"

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// 初始化审计客户端
	auditClient, err := client.NewKafkaClient([]string{"111.230.105.184:9092"}, "audit-logs", "menu-service")
	if err != nil {
		log.Printf("初始化审计客户端失败: %v, 将使用内存客户端", err)
		auditClient = client.NewMemoryClient("menu-service")
	}
	defer auditClient.Close()

	// 创建仓库
	menuItemRepo := repositories.NewMenuItemRepository(db)
	menuLogRepo := repositories.NewMenuLogRepository(db)
	cache := repositories.NewInMemoryCache()

	// 创建工具
	menuLogCreator := utils.NewMenuLogCreator()

	// 创建外部服务客户端
	rbacClient := services.NewRbacClient(cfg.RbacServiceURL, cfg.InternalAPIKeys["default"])

	// 创建服务
	menuItemService := services.NewMenuItemService(
		menuItemRepo,
		menuLogRepo,
		rbacClient,
		menuLogCreator,
		cache,
		auditClient, // 传递审计客户端
	)

	userMenuService := services.NewUserMenuService(
		menuItemRepo,
		rbacClient,
		cache,
		cfg.CacheExpiry*time.Minute,
	)

	menuLogService := services.NewMenuLogService(menuLogRepo)

	// 创建处理器
	menuItemHandler := handlers.NewMenuItemHandler(menuItemService)
	userMenuHandler := handlers.NewUserMenuHandler(userMenuService)
	menuLogHandler := handlers.NewMenuLogHandler(menuLogService)
	healthHandler := handlers.NewHealthHandler(VERSION)

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())
	r.Use(middleware.ErrorAuditMiddleware(auditClient)) // 添加错误审计中间件
	r.Use(middlewares.AuditMiddleware(auditClient))     // 添加审计中间件

	// 健康检查路由
	r.GET("/health", healthHandler.Health)

	// API版本v1
	v1 := r.Group("/api/menu")

	// 用户菜单路由 (需要内部API密钥认证)
	v1.POST("/user-menu", userMenuHandler.GetUserMenu)

	// 菜单项管理路由 (需要内部API密钥认证)
	items := v1.Group("/items")
	// items.Use(middlewares.InternalAuth(cfg.InternalAPIKeys))
	{
		items.POST("/create", menuItemHandler.CreateMenuItem)
		items.POST("/tree", menuItemHandler.GetMenuTree)
		items.POST("/update", menuItemHandler.UpdateMenuItem)
		items.POST("/delete", menuItemHandler.DeleteMenuItem)
		items.POST("/update-permission", menuItemHandler.UpdateMenuPermission)
	}

	// 菜单变更日志路由 (需要内部API密钥认证)
	logs := v1.Group("/logs")
	// logs.Use(middlewares.InternalAuth(cfg.InternalAPIKeys))
	{
		logs.POST("/list", menuLogHandler.ListMenuLogs)
	}
}