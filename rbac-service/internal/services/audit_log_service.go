// internal/services/audit_log_service.go
package services

import (
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"time"
)

// AuditLogService 审计日志服务接口
type AuditLogService interface {
	GetAuditLogs(page, pageSize int, filters map[string]interface{}) ([]*models.AuditLog, int64, error)
}

// auditLogService 审计日志服务实现
type auditLogService struct {
	auditRepo repositories.AuditLogRepository
}

// NewAuditLogService 创建审计日志服务实例
func NewAuditLogService(auditRepo repositories.AuditLogRepository) AuditLogService {
	return &auditLogService{
		auditRepo: auditRepo,
	}
}

// GetAuditLogs 查询审计日志
func (s *auditLogService) GetAuditLogs(page, pageSize int, filters map[string]interface{}) ([]*models.AuditLog, int64, error) {
	// 处理日期过滤
	if startTimeStr, ok := filters["start_time"].(string); ok && startTimeStr != "" {
		startTime, err := time.Parse(time.RFC3339, startTimeStr)
		if err == nil {
			filters["start_time"] = startTime
		} else {
			delete(filters, "start_time")
		}
	}

	if endTimeStr, ok := filters["end_time"].(string); ok && endTimeStr != "" {
		endTime, err := time.Parse(time.RFC3339, endTimeStr)
		if err == nil {
			filters["end_time"] = endTime
		} else {
			delete(filters, "end_time")
		}
	}

	return s.auditRepo.Find(page, pageSize, filters)
}
