// Package models internal/models/token.go
package models

import (
	"time"
)

// RefreshToken 刷新令牌模型，对应数据库中的refresh_tokens表
type RefreshToken struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	TokenHash string    `gorm:"type:varchar(255);unique;not null"` // 令牌的哈希值
	UserID    string    `gorm:"type:varchar(36);index;not null"`   // 关联的用户ID
	ExpiresAt time.Time `gorm:"index;not null"`                    // 过期时间
	CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

// TableName 指定数据库表名
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
