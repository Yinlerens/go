// internal/models/permission.go
package models

import (
	"time"
)

// Permission 权限模型，对应数据库中的permissions表
type Permission struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"`
	PermissionKey string    `gorm:"type:varchar(100);unique;not null;index"`
	Name          string    `gorm:"type:varchar(100);not null"`
	Type          string    `gorm:"type:varchar(20);index;null"`
	Description   string    `gorm:"type:varchar(255);null"`
	CreatedAt     time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt     time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime"`
}

// TableName 指定数据库表名
func (Permission) TableName() string {
	return "permissions"
}
