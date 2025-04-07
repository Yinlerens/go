// internal/repositories/token_repo.go
package repositories

import (
	"auth-service/internal/models"
	"time"

	"gorm.io/gorm"
)

// TokenRepository 令牌数据访问层接口
type TokenRepository interface {
	SaveRefreshToken(token *models.RefreshToken) error
	FindRefreshToken(tokenHash string) (*models.RefreshToken, error)
	DeleteRefreshToken(tokenHash string) error
	CleanExpiredTokens() error
}

// tokenRepository 令牌数据访问层实现
type tokenRepository struct {
	db *gorm.DB
}

// NewTokenRepository 创建令牌数据访问层实例
func NewTokenRepository(db *gorm.DB) TokenRepository {
	return &tokenRepository{db}
}

// SaveRefreshToken 保存刷新令牌
func (r *tokenRepository) SaveRefreshToken(token *models.RefreshToken) error {
	return r.db.Create(token).Error
}

// FindRefreshToken 根据令牌哈希查找刷新令牌
func (r *tokenRepository) FindRefreshToken(tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	err := r.db.Where("token_hash = ?", tokenHash).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

// DeleteRefreshToken 删除刷新令牌
func (r *tokenRepository) DeleteRefreshToken(tokenHash string) error {
	return r.db.Where("token_hash = ?", tokenHash).Delete(&models.RefreshToken{}).Error
}

// CleanExpiredTokens 清理过期的刷新令牌
func (r *tokenRepository) CleanExpiredTokens() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&models.RefreshToken{}).Error
}
