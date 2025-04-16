package config

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"os"
	"time"
)

// Config 应用配置结构
type Config struct {
	// 服务器配置
	ServerPort  string
	Environment string

	// MongoDB配置
	MongoURI    string
	MongoDBName string

	// RabbitMQ配置
	RabbitMQURL        string
	RabbitMQExchange   string
	RabbitMQQueue      string
	RabbitMQRoutingKey string

	// 认证配置
	JWTSecret string
}

// LoadConfig 从环境变量加载配置
func LoadConfig() (*Config, error) {
	config := &Config{
		// 服务器配置
		ServerPort:  getEnv("SERVER_PORT", "8083"),
		Environment: getEnv("ENVIRONMENT", "development"),

		// MongoDB配置
		MongoURI:    getEnv("MONGODB_URI", "mongodb://111.230.105.184:27017"),
		MongoDBName: getEnv("MONGODB_NAME", "audit"),

		// RabbitMQ配置
		RabbitMQURL:        getEnv("RABBITMQ_URL", "amqp://rabbitmq:rabbitmq@111.230.105.184:5672/"),
		RabbitMQExchange:   getEnv("RABBITMQ_EXCHANGE", "audit-logs"),
		RabbitMQQueue:      getEnv("RABBITMQ_QUEUE", "audit-service"),
		RabbitMQRoutingKey: getEnv("RABBITMQ_ROUTING_KEY", "audit-logs"),
	}

	return config, nil
}

// InitMongoDB 初始化MongoDB连接
func InitMongoDB(cfg *Config) (*mongo.Client, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 连接MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		return nil, fmt.Errorf("连接MongoDB失败: %w", err)
	}

	// 检查连接
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("MongoDB Ping失败: %w", err)
	}

	fmt.Println("成功连接MongoDB")
	return client, nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}