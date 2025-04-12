// internal/models/menu_change_log.go
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

// MenuChangeLog 菜单变更日志模型，对应menu_change_logs表
type MenuChangeLog struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"`
	MenuID       string    `gorm:"type:varchar(36);not null;index"`
	Action       string    `gorm:"type:varchar(20);not null;index"` // CREATE, UPDATE, DELETE
	OperatorID   string    `gorm:"type:varchar(36);not null;index"`
	OperatorType string    `gorm:"type:varchar(10);not null;index"` // USER, SERVICE
	BeforeChange JSON      `gorm:"type:json;null"`
	AfterChange  JSON      `gorm:"type:json;null"`
	CreatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

// TableName 指定数据库表名
func (MenuChangeLog) TableName() string {
	return "menu_change_logs"
}