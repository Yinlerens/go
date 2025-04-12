// internal/repositories/menu_log_repo.go
package repositories

import (
	"gorm.io/gorm"
	"menu-service/internal/models"
	"time"
)

// MenuLogRepository 菜单变更日志数据访问接口
type MenuLogRepository interface {
	Create(log *models.MenuChangeLog) error
	FindByMenuID(menuID string) ([]*models.MenuChangeLog, error)
	Find(page, pageSize int, filters map[string]interface{}) ([]*models.MenuChangeLog, int64, error)
}

// menuLogRepository 菜单变更日志数据访问实现
type menuLogRepository struct {
	db *gorm.DB
}

// NewMenuLogRepository 创建菜单变更日志仓库实例
func NewMenuLogRepository(db *gorm.DB) MenuLogRepository {
	return &menuLogRepository{db}
}

// Create 创建菜单变更日志
func (r *menuLogRepository) Create(log *models.MenuChangeLog) error {
	return r.db.Create(log).Error
}

// FindByMenuID 根据菜单ID查找变更日志
func (r *menuLogRepository) FindByMenuID(menuID string) ([]*models.MenuChangeLog, error) {
	var logs []*models.MenuChangeLog
	err := r.db.Where("menu_id = ?", menuID).Order("created_at DESC").Find(&logs).Error
	if err != nil {
		return nil, err
	}
	return logs, nil
}

// Find 查询菜单变更日志（带过滤条件和分页）
func (r *menuLogRepository) Find(page, pageSize int, filters map[string]interface{}) ([]*models.MenuChangeLog, int64, error) {
	var logs []*models.MenuChangeLog
	var total int64

	query := r.db.Model(&models.MenuChangeLog{}).Order("created_at DESC")

	// 应用过滤条件
	if filters != nil {
		if menuID, ok := filters["menu_id"].(string); ok && menuID != "" {
			query = query.Where("menu_id = ?", menuID)
		}
		if action, ok := filters["action"].(string); ok && action != "" {
			query = query.Where("action = ?", action)
		}
		if operatorID, ok := filters["operator_id"].(string); ok && operatorID != "" {
			query = query.Where("operator_id = ?", operatorID)
		}
		if operatorType, ok := filters["operator_type"].(string); ok && operatorType != "" {
			query = query.Where("operator_type = ?", operatorType)
		}
		if startTime, ok := filters["start_time"].(time.Time); ok {
			query = query.Where("created_at >= ?", startTime)
		}
		if endTime, ok := filters["end_time"].(time.Time); ok {
			query = query.Where("created_at <= ?", endTime)
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