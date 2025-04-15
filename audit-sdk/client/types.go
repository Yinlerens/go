package client

// EventType 审计事件类型
type EventType string

// 预定义事件类型
const (
	// 用户事件
	EventUserLogin        EventType = "USER_LOGIN"
	EventUserLogout       EventType = "USER_LOGOUT"
	EventUserCreated      EventType = "USER_CREATED"
	EventUserUpdated      EventType = "USER_UPDATED"
	EventUserStatusChange EventType = "USER_STATUS_CHANGE"

	// 角色权限事件
	EventRoleCreated        EventType = "ROLE_CREATED"
	EventRoleUpdated        EventType = "ROLE_UPDATED"
	EventRoleDeleted        EventType = "ROLE_DELETED"
	EventPermissionCreated  EventType = "PERMISSION_CREATED"
	EventPermissionUpdated  EventType = "PERMISSION_UPDATED"
	EventPermissionDeleted  EventType = "PERMISSION_DELETED"
	EventPermissionAssigned EventType = "PERMISSION_ASSIGNED"
	EventPermissionRevoked  EventType = "PERMISSION_REVOKED"
	EventUserRoleAssigned   EventType = "USER_ROLE_ASSIGNED"
	EventUserRoleRevoked    EventType = "USER_ROLE_REVOKED"

	// 菜单事件
	EventMenuCreated EventType = "MENU_CREATED"
	EventMenuUpdated EventType = "MENU_UPDATED"
	EventMenuDeleted EventType = "MENU_DELETED"

	// 系统事件
	EventSystemError EventType = "SYSTEM_ERROR"
	EventAPIAccess   EventType = "API_ACCESS"
	EventLogin       EventType = "LOGIN"
	EventLogout      EventType = "LOGOUT"
)

// ResultType 操作结果类型
type ResultType string

const (
	ResultSuccess ResultType = "SUCCESS"
	ResultFailure ResultType = "FAILURE"
)

// AuditEvent 审计事件结构
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

// Client 审计客户端接口
type Client interface {
	// Log 记录审计事件
	Log(event *AuditEvent) error

	// LogWithContext 使用请求上下文记录审计事件
	LogWithContext(ctx interface{}, eventType EventType, result ResultType, details map[string]interface{}) error

	// LogError 记录错误事件
	LogError(err error, details map[string]interface{}) error

	// Close 关闭客户端连接
	Close() error
}
