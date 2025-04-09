// internal/models/user_role.go
package models

import (
	"time"
)

// UserRole 用户-角色关联模型，对应user_roles表
type UserRole struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	UserID    string    `gorm:"type:varchar(36);not null;index"`
	RoleKey   string    `gorm:"type:varchar(50);not null;index"`
	CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

// TableName 指定数据库表名
func (UserRole) TableName() string {
	return "user_roles"
}
