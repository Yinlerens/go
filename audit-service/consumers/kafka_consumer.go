package consumers

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/segmentio/kafka-go"

	"audit-service/models"
	"audit-service/services"
)

// KafkaConsumer Kafka消费者
type KafkaConsumer struct {
	reader       *kafka.Reader
	auditService services.AuditService
}

// NewKafkaConsumer 创建Kafka消费者
func NewKafkaConsumer(brokers []string, topic, groupID string, auditService services.AuditService) *KafkaConsumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:         brokers,
		Topic:           topic,
		GroupID:         groupID,
		MinBytes:        10e3, // 10KB
		MaxBytes:        10e6, // 10MB
		MaxWait:         1 * time.Second,
		ReadLagInterval: -1,
	})

	return &KafkaConsumer{
		reader:       reader,
		auditService: auditService,
	}
}

// Start 开始消费消息
func (c *KafkaConsumer) Start(ctx context.Context) {
	go func() {
		for {
			select {
			case <-ctx.Done():
				if err := c.reader.Close(); err != nil {
					log.Printf("关闭Kafka消费者失败: %v", err)
				}
				return
			default:
				m, err := c.reader.ReadMessage(ctx)
				if err != nil {
					log.Printf("读取Kafka消息失败: %v", err)
					time.Sleep(1 * time.Second)
					continue
				}

				// 处理消息
				if err := c.processMessage(m.Value); err != nil {
					log.Printf("处理审计消息失败: %v", err)
				}
			}
		}
	}()
}

// processMessage 处理Kafka消息
func (c *KafkaConsumer) processMessage(data []byte) error {
	var event models.AuditEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return err
	}

	// 转换为审计日志
	auditLog := &models.AuditLog{
		EventID:       event.EventID,
		EventType:     event.EventType,
		Timestamp:     time.Unix(0, event.Timestamp*int64(time.Millisecond)),
		ServiceName:   event.ServiceName,
		UserID:        event.UserID,
		Username:      event.Username,
		RequestID:     event.RequestID,
		ClientIP:      event.ClientIP,
		UserAgent:     event.UserAgent,
		RequestPath:   event.RequestPath,
		RequestMethod: event.RequestMethod,
		ResourceType:  event.ResourceType,
		ResourceID:    event.ResourceID,
		Operation:     event.Operation,
		Result:        event.Result,
		Details:       event.Details,
		ErrorMessage:  event.ErrorMessage,
	}

	// 保存审计日志
	return c.auditService.SaveAuditLog(auditLog)
}
