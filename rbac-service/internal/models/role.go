// internal/models/role.go
package models

import (
	"time"
)

// Role 角色模型，对应数据库中的roles表
type Role struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"`
	RoleKey     string    `gorm:"type:varchar(50);unique;not null;index"`
	Name        string    `gorm:"type:varchar(100);not null"`
	Description string    `gorm:"type:varchar(255);null"`
	CreatedAt   time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime"`
}

// TableName 指定数据库表名
func (Role) TableName() string {
	return "roles"
}
