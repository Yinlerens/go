package client

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

// KafkaClient Kafka审计客户端
type KafkaClient struct {
	writer      *kafka.Writer
	serviceName string
}

// NewKafkaClient 创建新的Kafka审计客户端
func NewKafkaClient(brokers []string, topic, serviceName string) (Client, error) {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		BatchSize:    100,                    // 批量发送消息
		BatchTimeout: 100 * time.Millisecond, // 批量发送超时
		Async:        true,                   // 异步发送
	}

	return &KafkaClient{
		writer:      writer,
		serviceName: serviceName,
	}, nil
}

// Log 记录审计事件
func (c *KafkaClient) Log(event *AuditEvent) error {
	// 确保事件ID
	if event.EventID == "" {
		event.EventID = uuid.New().String()
	}

	// 确保时间戳
	if event.Timestamp == 0 {
		event.Timestamp = time.Now().UnixNano() / int64(time.Millisecond)
	}

	// 设置服务名称
	if event.ServiceName == "" {
		event.ServiceName = c.serviceName
	}

	// 序列化事件
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("序列化审计事件失败: %w", err)
	}

	// 发送到Kafka
	err = c.writer.WriteMessages(context.Background(),
		kafka.Message{
			Key:   []byte(event.EventID),
			Value: data,
		},
	)

	if err != nil {
		log.Printf("发送审计事件到Kafka失败: %v, 事件: %s", err, string(data))
		return fmt.Errorf("发送审计事件到Kafka失败: %w", err)
	}

	return nil
}

// LogWithContext 使用请求上下文记录审计事件
func (c *KafkaClient) LogWithContext(ctx interface{}, eventType EventType, result ResultType, details map[string]interface{}) error {
	// 从上下文获取信息
	var userID, username, requestID, clientIP, userAgent, requestPath, requestMethod string

	// 处理Gin上下文
	if ginCtx, ok := ctx.(*gin.Context); ok {
		auditContext, exists := ginCtx.Get("audit_context")
		if exists {
			if ac, ok := auditContext.(map[string]interface{}); ok {
				if v, exists := ac["user_id"]; exists {
					userID = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["username"]; exists {
					username = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["request_id"]; exists {
					requestID = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["client_ip"]; exists {
					clientIP = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["user_agent"]; exists {
					userAgent = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["request_path"]; exists {
					requestPath = fmt.Sprintf("%v", v)
				}
				if v, exists := ac["request_method"]; exists {
					requestMethod = fmt.Sprintf("%v", v)
				}
			}
		}
	}

	// 创建审计事件
	event := &AuditEvent{
		EventID:       uuid.New().String(),
		EventType:     string(eventType),
		Timestamp:     time.Now().UnixNano() / int64(time.Millisecond),
		ServiceName:   c.serviceName,
		UserID:        userID,
		Username:      username,
		RequestID:     requestID,
		ClientIP:      clientIP,
		UserAgent:     userAgent,
		RequestPath:   requestPath,
		RequestMethod: requestMethod,
		Result:        string(result),
		Details:       details,
	}

	return c.Log(event)
}

// LogError 记录错误事件
func (c *KafkaClient) LogError(err error, details map[string]interface{}) error {
	if details == nil {
		details = make(map[string]interface{})
	}

	// 添加错误信息
	details["error"] = err.Error()

	// 创建错误审计事件
	event := &AuditEvent{
		EventID:      uuid.New().String(),
		EventType:    string(EventSystemError),
		Timestamp:    time.Now().UnixNano() / int64(time.Millisecond),
		ServiceName:  c.serviceName,
		Result:       string(ResultFailure),
		ErrorMessage: err.Error(),
		Details:      details,
	}

	return c.Log(event)
}

// Close 关闭客户端连接
func (c *KafkaClient) Close() error {
	return c.writer.Close()
}
