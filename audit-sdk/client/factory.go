package client

import (
	"fmt"
	"os"
	"strings"
)

// NewClient 根据环境创建合适的审计客户端
func NewClient(serviceName string) (Client, error) {
	// 从环境变量获取配置
	auditMode := os.Getenv("AUDIT_MODE")

	// 默认配置
	if auditMode == "" {
		auditMode = "memory" // 开发环境默认使用内存模式
	}

	// 根据模式创建客户端
	switch strings.ToLower(auditMode) {
	case "rabbitmq":
		amqpURL := os.Getenv("RABBITMQ_URL")
		if amqpURL == "" {
			amqpURL = "amqp://rabbitmq:rabbitmq@111.230.105.184:5672/" // 默认配置
		}

		exchangeName := os.Getenv("RABBITMQ_EXCHANGE")
		if exchangeName == "" {
			exchangeName = "audit-logs"
		}

		routingKey := os.Getenv("RABBITMQ_ROUTING_KEY")
		if routingKey == "" {
			routingKey = "audit-logs"
		}

		return NewRabbitMQClient(amqpURL, exchangeName, routingKey, serviceName)

	case "memory":
		return NewMemoryClient(serviceName), nil

	default:
		return nil, fmt.Errorf("不支持的审计模式: %s", auditMode)
	}
}