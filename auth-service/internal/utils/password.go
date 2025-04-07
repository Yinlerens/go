// 密码处理工具
// internal/utils/password.go
package utils

import (
	"golang.org/x/crypto/bcrypt"
	"regexp"
)

// HashPassword 使用bcrypt算法对密码进行加密
func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

// CheckPassword 验证密码是否与加密后的哈希匹配
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// IsValidUsername 验证用户名是否符合规则（字母、数字和下划线，最长16位）
func IsValidUsername(username string) bool {
	// 用户名只能包含字母、数字、下划线，大小写敏感，长度1-16位
	pattern := `^[a-zA-Z0-9_]{1,16}$`
	match, _ := regexp.MatchString(pattern, username)
	return match
}

// IsValidPassword 验证密码是否符合要求（至少6位）
func IsValidPassword(password string) bool {
	return len(password) >= 6
}
