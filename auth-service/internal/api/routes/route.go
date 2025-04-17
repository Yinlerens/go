// auth-service/internal/api/routes/routes.go
package routes

import (
	"auth-service/internal/api/handlers"
	"auth-service/internal/api/middlewares"
	"auth-service/internal/config"
	"auth-service/internal/repositories"
	"auth-service/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"log"

	"github.com/Yinlerens/audit-sdk/client"
	"github.com/Yinlerens/audit-sdk/middleware"
)

// SetupRoutes 设置API路由
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// 初始化审计客户端
	auditClient, err := client.NewClient("auth-service")
	if err != nil {
		log.Printf("初始化审计客户端失败: %v, 将使用内存客户端", err)
		auditClient = client.NewMemoryClient("auth-service")
	}

	// 创建存储库
	userRepo := repositories.NewUserRepository(db)
	tokenRepo := repositories.NewTokenRepository(db)

	// 创建服务
	authService := services.NewAuthService(
		userRepo,
		tokenRepo,
		cfg.JWTSecret,
		cfg.AccessTokenExpiry,
		cfg.RefreshTokenExpiry,
	)
	userService := services.NewUserService(userRepo)

	// 创建处理器
	authHandler := handlers.NewAuthHandler(
		authService,
		cfg.CookieDomain,
		cfg.SecureCookie,
		cfg.AccessTokenExpiry,
		cfg.RefreshTokenExpiry,
		auditClient, // 传递审计客户端
	)
	userHandler := handlers.NewUserHandler(userService, auditClient) // 传递审计客户端

	// 使用全局中间件
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.CORS())
	r.Use(middleware.ErrorAuditMiddleware(auditClient)) // 添加错误审计中间件
	r.Use(middlewares.AuditMiddleware(auditClient))     // 添加审计中间件

	// 健康检查路由
	r.GET("/health", authHandler.Health)

	// API版本v1
	v1 := r.Group("/api")

	// 认证相关路由组
	auth := v1.Group("/auth")
	{
		// 公开路由，不需要认证
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", authHandler.Logout)

		// 以下路由需要内部API密钥认证
		authProtected := auth.Group("/")
		authProtected.Use(middlewares.InternalAuth(cfg.InternalAPIKeys))
		{
			authProtected.POST("/verify", authHandler.Verify)
			authProtected.POST("/refresh", authHandler.Refresh)
		}
	}

	// 用户相关路由组
	users := v1.Group("/auth/users")
	{
		users.POST("/list", userHandler.ListUsers)
		users.POST("/status", userHandler.UpdateStatus)
		users.POST("/validate", middlewares.InternalAuth(cfg.InternalAPIKeys), userHandler.ValidateUser)
	}
}