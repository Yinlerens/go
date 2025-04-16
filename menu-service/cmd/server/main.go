// cmd/server/main.go
package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"menu-service/internal/api/routes"
	"menu-service/internal/config"
)

func main() {
	// 加载配置
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
	r := gin.Default()
	routes.SetupRoutes(r, db, cfg)

	// 启动服务器
	log.Printf("菜单服务启动在 %s 端口1", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}