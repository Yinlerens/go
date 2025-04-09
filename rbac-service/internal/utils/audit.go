// internal/utils/audit.go
package utils

import (
	"rbac-service/internal/models"
	"time"
)

// AuditLogCreator 审计日志创建接口
type AuditLogCreator interface {
	CreateAuditLog(actorID, actorType, action, targetType, targetKey string, details models.JSON, status string, errorMessage string) *models.AuditLog
}

// defaultAuditLogCreator 审计日志创建默认实现
type defaultAuditLogCreator struct{}

// NewAuditLogCreator 创建审计日志生成器
func NewAuditLogCreator() AuditLogCreator {
	return &defaultAuditLogCreator{}
}

// CreateAuditLog 创建审计日志记录
func (c *defaultAuditLogCreator) CreateAuditLog(actorID, actorType, action, targetType, targetKey string, details models.JSON, status string, errorMessage string) *models.AuditLog {
	return &models.AuditLog{
		Timestamp:    time.Now(),
		ActorID:      actorID,
		ActorType:    actorType,
		Action:       action,
		TargetType:   targetType,
		TargetKey:    targetKey,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	}
}
