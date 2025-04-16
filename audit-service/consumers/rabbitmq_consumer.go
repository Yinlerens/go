package consumers

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/streadway/amqp"

	"audit-service/models"
	"audit-service/services"
)

// RabbitMQConsumer RabbitMQ消费者
type RabbitMQConsumer struct {
	conn         *amqp.Connection
	channel      *amqp.Channel
	queueName    string
	exchangeName string
	routingKey   string
	auditService services.AuditService
}

// NewRabbitMQConsumer 创建RabbitMQ消费者
func NewRabbitMQConsumer(amqpURL, exchangeName, routingKey, queueName string, auditService services.AuditService) (*RabbitMQConsumer, error) {
	// 连接RabbitMQ
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, err
	}

	// 创建通道
	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
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
		return nil, err
	}

	// 声明队列
	q, err := channel.QueueDeclare(
		queueName, // 队列名称
		true,      // 持久化
		false,     // 自动删除
		false,     // 排他性
		false,     // 无等待
		nil,       // 参数
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, err
	}

	// 绑定队列到交换机
	err = channel.QueueBind(
		q.Name,       // 队列名称
		routingKey,   // 路由键
		exchangeName, // 交换机名称
		false,        // 无等待
		nil,          // 参数
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, err
	}

	return &RabbitMQConsumer{
		conn:         conn,
		channel:      channel,
		queueName:    queueName,
		exchangeName: exchangeName,
		routingKey:   routingKey,
		auditService: auditService,
	}, nil
}

// Start 开始消费消息
func (c *RabbitMQConsumer) Start(ctx context.Context) error {
	// 设置预取计数
	err := c.channel.Qos(
		10,    // 预取计数
		0,     // 预取大小
		false, // 全局设置
	)
	if err != nil {
		return err
	}

	// 消费消息
	msgs, err := c.channel.Consume(
		c.queueName, // 队列名称
		"",          // 消费者
		false,       // 自动应答
		false,       // 排他性
		false,       // 不等待
		false,       // 参数
		nil,         // 额外参数
	)
	if err != nil {
		return err
	}

	// 启动goroutine处理消息
	go func() {
		for {
			select {
			case <-ctx.Done():
				// 关闭连接
				if c.channel != nil {
					c.channel.Close()
				}
				if c.conn != nil {
					c.conn.Close()
				}
				return
			case msg, ok := <-msgs:
				if !ok {
					log.Println("RabbitMQ通道已关闭")
					return
				}
				// 处理消息
				if err := c.processMessage(msg.Body); err != nil {
					log.Printf("处理审计消息失败: %v", err)
					// 拒绝消息并重新排队
					msg.Nack(false, true)
				} else {
					// 确认消息
					msg.Ack(false)
				}
			}
		}
	}()

	return nil
}

// processMessage 处理RabbitMQ消息
func (c *RabbitMQConsumer) processMessage(data []byte) error {
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