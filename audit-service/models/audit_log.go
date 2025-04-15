package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AuditLog 审计日志模型
type AuditLog struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	EventID     string             `bson:"event_id" json:"event_id"`
	EventType   string             `bson:"event_type" json:"event_type"`
	Timestamp   time.Time          `bson:"timestamp" json:"timestamp"`
	ServiceName string             `bson:"service_name" json:"service_name"`

	// 用户上下文
	UserID   string `bson:"user_id,omitempty" json:"user_id,omitempty"`
	Username string `bson:"username,omitempty" json:"username,omitempty"`

	// 请求上下文
	RequestID     string `bson:"request_id,omitempty" json:"request_id,omitempty"`
	ClientIP      string `bson:"client_ip,omitempty" json:"client_ip,omitempty"`
	UserAgent     string `bson:"user_agent,omitempty" json:"user_agent,omitempty"`
	RequestPath   string `bson:"request_path,omitempty" json:"request_path,omitempty"`
	RequestMethod string `bson:"request_method,omitempty" json:"request_method,omitempty"`

	// 操作信息
	ResourceType string `bson:"resource_type,omitempty" json:"resource_type,omitempty"`
	ResourceID   string `bson:"resource_id,omitempty" json:"resource_id,omitempty"`
	Operation    string `bson:"operation,omitempty" json:"operation,omitempty"`
	Result       string `bson:"result" json:"result"`

	// 详细信息
	Details      map[string]interface{} `bson:"details,omitempty" json:"details,omitempty"`
	ErrorMessage string                 `bson:"error_message,omitempty" json:"error_message,omitempty"`
}

// AuditEvent Kafka接收的审计事件
type AuditEvent struct {
	// 基本信息
	EventID     string `json:"event_id"`
	EventType   string `json:"event_type"`
	Timestamp   int64  `json:"timestamp"`
	ServiceName string `json:"service_name"`

	// 用户上下文
	UserID   string `json:"user_id,omitempty"`
	Username string `json:"username,omitempty"`

	// 请求上下文
	RequestID     string `json:"request_id,omitempty"`
	ClientIP      string `json:"client_ip,omitempty"`
	UserAgent     string `json:"user_agent,omitempty"`
	RequestPath   string `json:"request_path,omitempty"`
	RequestMethod string `json:"request_method,omitempty"`

	// 操作信息
	ResourceType string `json:"resource_type,omitempty"`
	ResourceID   string `json:"resource_id,omitempty"`
	Operation    string `json:"operation,omitempty"`
	Result       string `json:"result"`

	// 详细信息
	Details      map[string]interface{} `json:"details,omitempty"`
	ErrorMessage string                 `json:"error_message,omitempty"`
}
