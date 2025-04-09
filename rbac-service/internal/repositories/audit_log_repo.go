// internal/repositories/audit_log_repo.go
package repositories

import (
	"gorm.io/gorm"
	"rbac-service/internal/models"
	"time"
)

// AuditLogRepository 审计日志数据访问接口
type AuditLogRepository interface {
	Create(log *models.AuditLog) error
	Find(page, pageSize int, filters map[string]interface{}) ([]*models.AuditLog, int64, error)
}

// auditLogRepository 审计日志数据访问实现
type auditLogRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository 创建审计日志仓库实例
func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &auditLogRepository{db}
}

// Create 创建审计日志
func (r *auditLogRepository) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

// Find 查询审计日志（带过滤条件和分页）
func (r *auditLogRepository) Find(page, pageSize int, filters map[string]interface{}) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64

	query := r.db.Model(&models.AuditLog{}).Order("timestamp DESC")

	// 应用过滤条件
	if filters != nil {
		if actorID, ok := filters["actor_id"].(string); ok && actorID != "" {
			query = query.Where("actor_id = ?", actorID)
		}
		if actorType, ok := filters["actor_type"].(string); ok && actorType != "" {
			query = query.Where("actor_type = ?", actorType)
		}
		if action, ok := filters["action"].(string); ok && action != "" {
			query = query.Where("action = ?", action)
		}
		if targetType, ok := filters["target_type"].(string); ok && targetType != "" {
			query = query.Where("target_type = ?", targetType)
		}
		if targetKey, ok := filters["target_key"].(string); ok && targetKey != "" {
			query = query.Where("target_key = ?", targetKey)
		}
		if status, ok := filters["status"].(string); ok && status != "" {
			query = query.Where("status = ?", status)
		}
		if startTime, ok := filters["start_time"].(time.Time); ok {
			query = query.Where("timestamp >= ?", startTime)
		}
		if endTime, ok := filters["end_time"].(time.Time); ok {
			query = query.Where("timestamp <= ?", endTime)
		}
	}

	// 计算总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 查询分页数据
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
