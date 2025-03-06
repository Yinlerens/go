package auth

import (
	"github.com/gin-contrib/sessions"
)

// SessionStorage 实现了Logto客户端所需的存储接口
type SessionStorage struct {
	session sessions.Session
}

// NewSessionStorage 创建一个新的会话存储实例
func NewSessionStorage(session sessions.Session) *SessionStorage {
	return &SessionStorage{session: session}
}

// GetItem 从会话中获取指定键的值
func (storage *SessionStorage) GetItem(key string) string {
	value := storage.session.Get(key)
	if value == nil {
		return ""
	}
	return value.(string)
}

// SetItem 在会话中设置指定键的值
func (storage *SessionStorage) SetItem(key, value string) {
	storage.session.Set(key, value)
	storage.session.Save()
}
