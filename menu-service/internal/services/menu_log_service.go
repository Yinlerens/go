// internal/services/menu_log_service.go
package services

import (
	"menu-service/internal/models"
	"menu-service/internal/repositories"
	"time"
)

// MenuLogService 菜单变更日志服务接口
type MenuLogService interface {
	GetMenuLogs(page, pageSize int, filters map[string]interface{}) ([]*models.MenuChangeLog, int64, error)
}

// menuLogService 菜单变更日志服务实现
type menuLogService struct {
	menuLogRepo repositories.MenuLogRepository
}

// NewMenuLogService 创建菜单变更日志服务实例
func NewMenuLogService(menuLogRepo repositories.MenuLogRepository) MenuLogService {
	return &menuLogService{
		menuLogRepo: menuLogRepo,
	}
}

// GetMenuLogs 查询菜单变更日志
func (s *menuLogService) GetMenuLogs(page, pageSize int, filters map[string]interface{}) ([]*models.MenuChangeLog, int64, error) {
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

	return s.menuLogRepo.Find(page, pageSize, filters)
}