package client

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"log"
	"time"
)

// MemoryClient 内存审计客户端(仅用于测试/开发)
type MemoryClient struct {
	serviceName string
	events      []*AuditEvent
}

// NewMemoryClient 创建新的内存审计客户端
func NewMemoryClient(serviceName string) Client {
	return &MemoryClient{
		serviceName: serviceName,
		events:      make([]*AuditEvent, 0),
	}
}

// Log 记录审计事件
func (c *MemoryClient) Log(event *AuditEvent) error {
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

	// 添加到内存中
	c.events = append(c.events, event)

	// 打印日志
	log.Printf("[AUDIT] %s: %s - User: %s, Result: %s",
		event.EventType, event.Operation, event.Username, event.Result)

	return nil
}

// LogWithContext 使用请求上下文记录审计事件
func (c *MemoryClient) LogWithContext(ctx interface{}, eventType EventType, result ResultType, details map[string]interface{}) error {
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
func (c *MemoryClient) LogError(err error, details map[string]interface{}) error {
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
func (c *MemoryClient) Close() error {
	// 无需关闭任何连接
	return nil
}

// GetEvents 获取记录的事件(仅用于测试)
func (c *MemoryClient) GetEvents() []*AuditEvent {
	return c.events
}
