// internal/services/user_service.go
package services

import (
	"auth-service/internal/models"
	"auth-service/internal/repositories"
	"errors"
)

// UserService 用户服务接口
type UserService interface {
	UpdateUserStatus(userID, status string) error
	GetUsers(page, pageSize int, username string) ([]*models.User, int64, error)
	ValidateUser(userID string) (bool, error) // 新增方法
}

// userService 用户服务实现
type userService struct {
	userRepo repositories.UserRepository
}

// NewUserService 创建用户服务实例
func NewUserService(userRepo repositories.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}

// UpdateUserStatus 实现 UserService 接口的 UpdateUserStatus 方法
func (s *userService) UpdateUserStatus(userID, status string) error {
	// 验证状态值
	if status != "active" && status != "inactive" {
		return errors.New("无效的状态值")
	}

	// 查找用户
	user, err := s.userRepo.FindByUserID(userID)
	if err != nil {
		return errors.New("目标用户不存在")
	}

	// 更新用户状态
	if err := s.userRepo.UpdateStatus(user.UserID, status); err != nil {
		return errors.New("更新用户状态失败")
	}

	return nil
}
func (s *userService) GetUsers(page, pageSize int, username string) ([]*models.User, int64, error) {
	return s.userRepo.FindAll(page, pageSize, username)
}

// ValidateUser 验证用户是否存在且状态为active
func (s *userService) ValidateUser(userID string) (bool, error) {
	// 查找用户
	user, err := s.userRepo.FindByUserID(userID)
	if err != nil {
		return false, errors.New("用户不存在")
	}

	// 检查用户状态
	if user.Status != "active" {
		return false, errors.New("用户状态非active")
	}

	return true, nil
}