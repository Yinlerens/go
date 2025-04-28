// cmd/server/main.go
package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"menu-service/internal/api/routes"
	"menu-service/internal/config"
	"menu-service/internal/utils"
)

func main() {
	// 加载配置
	utils.InitLogger()
	defer utils.Sync()
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 设置运行模式
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 初始化数据库连接
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 初始化路由
	r := gin.New()
	// 创建 Logger 配置
	logConfig := gin.LoggerConfig{
		// 可以自定义日志格式 (可选)
		// Format: `[GIN] ${time.RFC3339} | ${status} | ${latency} | ${clientIP} | ${method} ${path} ${queryParams}\n`,
		SkipPaths: []string{"/health"}, // <--- 在这里添加要跳过的路径
	}
	// 使用配置好的 Logger 中间件
	r.Use(gin.LoggerWithConfig(logConfig))
	// 不要忘记添加 Recovery 中间件，gin.Default() 会自动添加
	r.Use(gin.Recovery())
	routes.SetupRoutes(r, db, cfg)

	// 启动服务器
	log.Printf("菜单服务启动在 %s 端口1", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}