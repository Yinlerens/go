package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"audit-service/api/routes"
	"audit-service/config"
	"audit-service/consumers"
	"audit-service/repositories"
	"audit-service/services"
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

	// 连接MongoDB
	mongoClient, err := connectMongoDB(cfg.MongoURI)
	if err != nil {
		log.Fatalf("连接MongoDB失败: %v", err)
	}
	defer func() {
		if err := mongoClient.Disconnect(context.Background()); err != nil {
			log.Printf("关闭MongoDB连接失败: %v", err)
		}
	}()

	// 创建仓库
	auditRepo := repositories.NewMongoAuditRepository(mongoClient, cfg.MongoDBName)

	// 创建服务
	auditService := services.NewAuditService(auditRepo)

	// 创建Kafka消费者
	kafkaConsumer := consumers.NewKafkaConsumer(
		cfg.KafkaBrokers,
		cfg.KafkaTopic,
		cfg.KafkaGroupID,
		auditService,
	)

	// 创建上下文用于优雅关闭
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动Kafka消费者
	kafkaConsumer.Start(ctx)

	// 创建Gin路由
	r := gin.Default()
	routes.SetupRoutes(r, auditService, cfg.JWTSecret)

	// 创建HTTP服务器
	server := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 启动HTTP服务器
	go func() {
		log.Printf("审计服务启动在 %s 端口", cfg.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("启动HTTP服务器失败: %v", err)
		}
	}()

	// 等待关闭信号
	<-quit
	log.Println("关闭服务器...")

	// 创建5秒超时的上下文
	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 关闭HTTP服务器
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("服务器关闭失败: %v", err)
	}

	log.Println("服务器优雅关闭")
}

// connectMongoDB 连接MongoDB
func connectMongoDB(uri string) (*mongo.Client, error) {
	// 创建MongoDB客户端选项
	clientOptions := options.Client().ApplyURI(uri)

	// 连接MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("连接MongoDB失败: %w", err)
	}

	// 验证连接
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("MongoDB Ping失败: %w", err)
	}

	fmt.Println("成功连接MongoDB!")
	return client, nil
}
