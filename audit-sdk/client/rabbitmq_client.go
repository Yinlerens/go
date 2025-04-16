package client

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/streadway/amqp"
	"log"
	"time"
)

// RabbitMQClient RabbitMQ审计客户端
type RabbitMQClient struct {
	conn         *amqp.Connection
	channel      *amqp.Channel
	exchangeName string
	routingKey   string
	serviceName  string
}

// NewRabbitMQClient 创建新的RabbitMQ审计客户端
func NewRabbitMQClient(amqpURL, exchangeName, routingKey, serviceName string) (Client, error) {
	// 连接RabbitMQ
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("连接RabbitMQ失败: %w", err)
	}

	// 创建通道
	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("创建RabbitMQ通道失败: %w", err)
	}

	// 声明交换机
	err = channel.ExchangeDeclare(
		exchangeName, // 交换机名称
		"direct",     // 类型
		true,         // 持久化
		false,        // 自动删除
		false,        // 内部使用
		false,        // 无等待
		nil,          // 参数
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, fmt.Errorf("声明RabbitMQ交换机失败: %w", err)
	}

	return &RabbitMQClient{
		conn:         conn,
		channel:      channel,
		exchangeName: exchangeName,
		routingKey:   routingKey,
		serviceName:  serviceName,
	}, nil
}

// Log 记录审计事件
func (c *RabbitMQClient) Log(event *AuditEvent) error {
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

	// 发送到RabbitMQ
	err = c.channel.Publish(
		c.exchangeName, // 交换机
		c.routingKey,   // 路由键
		false,          // mandatory
		false,          // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         data,
			DeliveryMode: amqp.Persistent, // 持久化消息
		},
	)

	if err != nil {
		log.Printf("发送审计事件到RabbitMQ失败: %v, 事件: %s", err, string(data))
		return fmt.Errorf("发送审计事件到RabbitMQ失败: %w", err)
	}

	return nil
}

// LogWithContext 使用请求上下文记录审计事件
func (c *RabbitMQClient) LogWithContext(ctx interface{}, eventType EventType, result ResultType, details map[string]interface{}) error {
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
func (c *RabbitMQClient) LogError(err error, details map[string]interface{}) error {
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
func (c *RabbitMQClient) Close() error {
	if c.channel != nil {
		if err := c.channel.Close(); err != nil {
			log.Printf("关闭RabbitMQ通道失败: %v", err)
		}
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}