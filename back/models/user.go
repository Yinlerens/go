package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`                         // 用户ID，主键
	CreatedAt time.Time      `json:"created_at"`                                   // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                                   // 更新时间
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`                               // 软删除时间
	Username  string         `json:"username" gorm:"size:50;uniqueIndex;not null"` // 用户名，唯一索引
	Email     string         `json:"email" gorm:"size:100;uniqueIndex;not null"`   // 邮箱，唯一索引
	Password  string         `json:"-" gorm:"size:100;not null"`                   // 密码，JSON序列化时忽略
	Nickname  string         `json:"nickname" gorm:"size:50"`                      // 昵称
	Avatar    string         `json:"avatar" gorm:"size:255"`                       // 头像URL
	Role      string         `json:"role" gorm:"size:20;default:'user'"`           // 角色：admin, user等
	Status    int            `json:"status" gorm:"default:1"`                      // 状态：1正常, 0禁用
	LastLogin time.Time      `json:"last_login"`                                   // 最后登录时间
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeSave 保存前的钩子函数，用于密码加密
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	// 如果密码被修改，则进行加密
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword 检查密码是否正确
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
