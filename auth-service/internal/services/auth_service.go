// internal/services/auth_service.go
package services

import (
	"auth-service/internal/models"
	"auth-service/internal/repositories"
	"auth-service/internal/utils"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuthService 认证服务接口
type AuthService interface {
	Register(username, password string) (*models.User, error)
	Login(username, password string) (*models.User, string, string, error)
	VerifyToken(tokenString string) (*utils.JWTClaims, error)
	RefreshToken(refreshToken string) (string, string, error)
	Logout(refreshToken string) error
}

// authService 认证服务实现
type authService struct {
	userRepo      repositories.UserRepository
	tokenRepo     repositories.TokenRepository
	jwtSecret     string
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

// NewAuthService 创建认证服务实例
func NewAuthService(
	userRepo repositories.UserRepository,
	tokenRepo repositories.TokenRepository,
	jwtSecret string,
	accessExpiry time.Duration,
	refreshExpiry time.Duration,
) AuthService {
	return &authService{
		userRepo:      userRepo,
		tokenRepo:     tokenRepo,
		jwtSecret:     jwtSecret,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// Register 实现 AuthService 接口的 Register 方法
func (s *authService) Register(username, password string) (*models.User, error) {
	// 验证用户名格式
	if !utils.IsValidUsername(username) {
		return nil, errors.New("用户名格式或长度无效")
	}

	// 验证密码长度
	if !utils.IsValidPassword(password) {
		return nil, errors.New("密码长度至少需要6位")
	}

	// 检查用户名是否已存在
	_, err := s.userRepo.FindByUsername(username)
	if err == nil {
		return nil, errors.New("用户名已被注册")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.New("服务器内部错误")
	}

	// 密码加密
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	// 创建用户
	user := &models.User{
		UserID:       uuid.New().String(),
		Username:     username,
		PasswordHash: hashedPassword,
		Status:       "active",
	}

	// 保存用户
	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("用户创建失败")
	}

	return user, nil
}

// Login 实现 AuthService 接口的 Login 方法
func (s *authService) Login(username, password string) (*models.User, string, string, error) {
	// 查找用户
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", errors.New("用户名或密码错误")
		}
		return nil, "", "", errors.New("服务器内部错误")
	}

	// 检查用户状态
	if user.Status != "active" {
		return nil, "", "", errors.New("账户已被禁用")
	}

	// 验证密码
	if !utils.CheckPassword(password, user.PasswordHash) {
		return nil, "", "", errors.New("用户名或密码错误")
	}

	// 生成JWT访问令牌
	accessToken, err := utils.GenerateJWT(user.UserID, user.Username, s.jwtSecret, s.accessExpiry)
	if err != nil {
		return nil, "", "", errors.New("生成访问令牌失败")
	}

	// 生成刷新令牌
	refreshToken, tokenHash, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, "", "", errors.New("生成刷新令牌失败")
	}

	// 保存刷新令牌
	tokenRecord := &models.RefreshToken{
		TokenHash: tokenHash,
		UserID:    user.UserID,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}
	if err := s.tokenRepo.SaveRefreshToken(tokenRecord); err != nil {
		return nil, "", "", errors.New("保存刷新令牌失败")
	}

	return user, accessToken, refreshToken, nil
}

// VerifyToken 实现 AuthService 接口的 VerifyToken 方法
func (s *authService) VerifyToken(tokenString string) (*utils.JWTClaims, error) {
	// 解析令牌
	claims, err := utils.ParseJWT(tokenString, s.jwtSecret)
	if err != nil {
		return nil, errors.New("访问凭证无效或已过期")
	}

	// 验证用户是否存在且状态为active
	user, err := s.userRepo.FindByUserID(claims.UserID)
	if err != nil {
		return nil, errors.New("用户无效或已被禁用")
	}

	if user.Status != "active" {
		return nil, errors.New("用户无效或已被禁用")
	}

	return claims, nil
}

// RefreshToken 实现 AuthService 接口的 RefreshToken 方法
func (s *authService) RefreshToken(refreshTokenStr string) (string, string, error) {
	// 计算令牌哈希
	tokenHash := utils.HashRefreshToken(refreshTokenStr)

	// 查找刷新令牌
	tokenRecord, err := s.tokenRepo.FindRefreshToken(tokenHash)
	if err != nil {
		return "", "", errors.New("刷新凭证无效或已过期")
	}

	// 检查令牌是否过期
	if time.Now().After(tokenRecord.ExpiresAt) {
		// 删除过期令牌
		_ = s.tokenRepo.DeleteRefreshToken(tokenHash)
		return "", "", errors.New("刷新凭证无效或已过期")
	}

	// 查找用户
	user, err := s.userRepo.FindByUserID(tokenRecord.UserID)
	if err != nil {
		return "", "", errors.New("用户无效或已被禁用")
	}

	// 检查用户状态
	if user.Status != "active" {
		return "", "", errors.New("用户无效或已被禁用")
	}

	// 删除当前刷新令牌（令牌轮换）
	if err := s.tokenRepo.DeleteRefreshToken(tokenHash); err != nil {
		return "", "", errors.New("服务器内部错误")
	}

	// 生成新的访问令牌
	accessToken, err := utils.GenerateJWT(user.UserID, user.Username, s.jwtSecret, s.accessExpiry)
	if err != nil {
		return "", "", errors.New("生成访问令牌失败")
	}

	// 生成新的刷新令牌
	newRefreshToken, newTokenHash, err := utils.GenerateRefreshToken()
	if err != nil {
		return "", "", errors.New("生成刷新令牌失败")
	}

	// 保存新的刷新令牌
	newTokenRecord := &models.RefreshToken{
		TokenHash: newTokenHash,
		UserID:    user.UserID,
		ExpiresAt: time.Now().Add(s.refreshExpiry),
	}
	if err := s.tokenRepo.SaveRefreshToken(newTokenRecord); err != nil {
		return "", "", errors.New("保存刷新令牌失败")
	}

	return accessToken, newRefreshToken, nil
}

// Logout 实现 AuthService 接口的 Logout 方法
func (s *authService) Logout(refreshTokenStr string) error {
	// 如果刷新令牌为空，直接返回成功
	if refreshTokenStr == "" {
		return nil
	}

	// 计算令牌哈希
	tokenHash := utils.HashRefreshToken(refreshTokenStr)

	// 删除刷新令牌
	if err := s.tokenRepo.DeleteRefreshToken(tokenHash); err != nil {
		// 如果令牌不存在，也视为成功
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errors.New("服务器内部错误")
	}

	return nil
}
