// internal/models/menu_item.go
package models

import (
	"time"
)

// MenuItem 菜单项模型，对应menu_items表
type MenuItem struct {
	ID            string    `gorm:"type:varchar(36);primaryKey"`
	Name          string    `gorm:"type:varchar(50);not null"`
	Path          string    `gorm:"type:varchar(255);not null;index"`
	Icon          string    `gorm:"type:varchar(50);null"`
	PermissionKey string    `gorm:"type:varchar(100);null;index"`
	ParentID      string    `gorm:"type:varchar(36);null;index"`
	Order         int       `gorm:"type:int;not null;default:0"`
	IsEnabled     bool      `gorm:"type:tinyint(1);not null;default:1"`
	Meta          JSON      `gorm:"type:json;null"`
	CreatedAt     time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt     time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime"`
}

// TableName 指定数据库表名
func (MenuItem) TableName() string {
	return "menu_items"
}