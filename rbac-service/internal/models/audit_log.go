// internal/models/audit_log.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// JSON 自定义类型用于存储JSON格式数据
type JSON map[string]interface{}

// Value 实现 driver.Valuer 接口
func (j JSON) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// Scan 实现 sql.Scanner 接口
func (j *JSON) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("类型断言失败")
	}
	return json.Unmarshal(bytes, &j)
}

// AuditLog 审计日志模型，对应audit_logs表
type AuditLog struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"`
	Timestamp    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP(6);index"`
	ActorID      string    `gorm:"type:varchar(255);not null;index"`
	ActorType    string    `gorm:"type:varchar(10);not null;index"`
	Action       string    `gorm:"type:varchar(50);not null;index"`
	TargetType   string    `gorm:"type:varchar(20);null;index"`
	TargetKey    string    `gorm:"type:varchar(255);null;index"`
	Details      JSON      `gorm:"type:json;null"`
	Status       string    `gorm:"type:varchar(10);not null;index"`
	ErrorMessage string    `gorm:"type:text;null"`
	UserID       string    `gorm:"type:varchar(36); null;index"`
	Username     string    `gorm:"type:varchar(100); null;index"`
	UserIP       string    `gorm:"type:varchar(50); null;index"`
}

// TableName 指定数据库表名
func (AuditLog) TableName() string {
	return "audit_logs"
}