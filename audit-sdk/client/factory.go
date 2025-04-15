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
	case "kafka":
		brokers := strings.Split(os.Getenv("KAFKA_BROKERS"), ",")
		if len(brokers) == 0 || (len(brokers) == 1 && brokers[0] == "") {
			brokers = []string{"111.230.105.184:9092"} // 默认配置
		}

		topic := os.Getenv("KAFKA_TOPIC")
		if topic == "" {
			topic = "audit-logs"
		}

		return NewKafkaClient(brokers, topic, serviceName)

	case "memory":
		return NewMemoryClient(serviceName), nil

	default:
		return nil, fmt.Errorf("不支持的审计模式: %s", auditMode)
	}
}
