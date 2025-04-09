// internal/models/role_permission.go
package models

import (
	"time"
)

// RolePermission 角色-权限关联模型，对应role_permissions表
type RolePermission struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"`
	RoleKey       string    `gorm:"type:varchar(50);not null;index"`
	PermissionKey string    `gorm:"type:varchar(100);not null;index"`
	CreatedAt     time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

// TableName 指定数据库表名
func (RolePermission) TableName() string {
	return "role_permissions"
}
