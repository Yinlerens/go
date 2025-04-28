// JWT工具
// internal/utils/jwt.go
package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

// JWTClaims 自定义JWT声明结构
type JWTClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Key      string `json:"key"`
	jwt.RegisteredClaims
}

// GenerateJWT 生成JWT访问令牌
func GenerateJWT(userID, username, secret string, expiry time.Duration) (string, error) {
	// 设置JWT声明
	claims := JWTClaims{
		UserID:   userID,
		Username: username,
		Key:      "auth-service",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "auth-service",
		},
	}
	Info("secret", secret)
	// 创建token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名并获取token字符串
	return token.SignedString([]byte(secret))
}

// ParseJWT 解析JWT令牌
func ParseJWT(tokenString, secret string) (*JWTClaims, error) {
	// 解析token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	// 类型断言
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// GenerateRefreshToken 生成刷新令牌
func GenerateRefreshToken() (string, string, error) {
	// 生成32字节的随机令牌
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", "", err
	}

	// Base64编码令牌
	token := base64.StdEncoding.EncodeToString(b)

	// 使用SHA-256哈希令牌
	hash := sha256.Sum256([]byte(token))
	tokenHash := hex.EncodeToString(hash[:])

	return token, tokenHash, nil
}

// HashRefreshToken 对刷新令牌进行哈希
func HashRefreshToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}