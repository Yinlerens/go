// internal/utils/menu_log_creator.go
package utils

import (
	"menu-service/internal/models"
	"time"
)

// MenuLogCreator 菜单日志创建接口
type MenuLogCreator interface {
	CreateMenuLog(menuID, action, operatorID, operatorType string, beforeChange, afterChange models.JSON) *models.MenuChangeLog
}

// defaultMenuLogCreator 菜单日志创建默认实现
type defaultMenuLogCreator struct{}

// NewMenuLogCreator 创建菜单日志生成器
func NewMenuLogCreator() MenuLogCreator {
	return &defaultMenuLogCreator{}
}

// CreateMenuLog 创建菜单变更日志记录
func (c *defaultMenuLogCreator) CreateMenuLog(menuID, action, operatorID, operatorType string, beforeChange, afterChange models.JSON) *models.MenuChangeLog {
	return &models.MenuChangeLog{
		MenuID:       menuID,
		Action:       action,
		OperatorID:   operatorID,
		OperatorType: operatorType,
		BeforeChange: beforeChange,
		AfterChange:  afterChange,
		CreatedAt:    time.Now(),
	}
}