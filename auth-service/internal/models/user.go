// Package models internal/models/user.go
package models

import (
	"time"
)

// User 用户模型，对应数据库中的users表
type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"`
	UserID       string    `gorm:"type:varchar(36);unique;not null"` // 对外暴露的UUID
	Username     string    `gorm:"type:varchar(16);unique;not null"` // 用户名
	PasswordHash string    `gorm:"type:varchar(255);not null"`       // 加密后的密码
	Status       string    `gorm:"type:varchar(10);not null;index"`  // 用户状态：active 或 inactive
	CreatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;autoUpdateTime"`
}

// TableName 指定数据库表名
func (User) TableName() string {
	return "users"
}
