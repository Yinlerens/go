// internal/utils/audit.go
package utils

import (
	"rbac-service/internal/models"
	"time"
)

type AuditLogCreator interface {
	CreateAuditLog(actorID, actorType, action, targetType, targetKey string, details models.JSON, status string, errorMessage string, userID, username, userIP string) *models.AuditLog
}

type defaultAuditLogCreator struct{}

func NewAuditLogCreator() AuditLogCreator {
	return &defaultAuditLogCreator{}
}

func (c *defaultAuditLogCreator) CreateAuditLog(actorID, actorType, action, targetType, targetKey string, details models.JSON, status string, errorMessage string, userID, username, userIP string) *models.AuditLog {
	return &models.AuditLog{
		Timestamp:    time.Now(),
		ActorID:      actorID,
		ActorType:    actorType,
		UserID:       userID,
		Username:     username,
		UserIP:       userIP,
		Action:       action,
		TargetType:   targetType,
		TargetKey:    targetKey,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	}
}