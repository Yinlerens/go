package services

import (
	"errors"
	"fmt"

	"back/models"

	"gorm.io/gorm"
)

// UserService 用户服务
type UserService struct {
	DB *gorm.DB
}

// NewUserService 创建用户服务实例
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{DB: db}
}

// GetUsers 获取所有用户
func (s *UserService) GetUsers() ([]models.User, error) {
	var users []models.User
	result := s.DB.Find(&users)
	if result.Error != nil {
		return nil, fmt.Errorf("查询用户列表失败: %w", result.Error)
	}
	return users, nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	result := s.DB.First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("用户不存在: %w", result.Error)
		}
		return nil, fmt.Errorf("查询用户失败: %w", result.Error)
	}
	return &user, nil
}

// GetUserByUsername 根据用户名获取用户
func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	result := s.DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("用户不存在: %w", result.Error)
		}
		return nil, fmt.Errorf("查询用户失败: %w", result.Error)
	}
	return &user, nil
}

// GetUserByEmail 根据邮箱获取用户
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	result := s.DB.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("用户不存在: %w", result.Error)
		}
		return nil, fmt.Errorf("查询用户失败: %w", result.Error)
	}
	return &user, nil
}

// CreateUser 创建用户
func (s *UserService) CreateUser(user *models.User) error {
	// 检查用户名是否已存在
	var existingUser models.User
	if result := s.DB.Where("username = ?", user.Username).First(&existingUser); result.Error == nil {
		return errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if result := s.DB.Where("email = ?", user.Email).First(&existingUser); result.Error == nil {
		return errors.New("邮箱已存在")
	}

	// 创建用户
	result := s.DB.Create(user)
	if result.Error != nil {
		return fmt.Errorf("创建用户失败: %w", result.Error)
	}
	return nil
}

// UpdateUser 更新用户
func (s *UserService) UpdateUser(user *models.User) error {
	// 检查用户是否存在
	var existingUser models.User
	if result := s.DB.First(&existingUser, user.ID); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return fmt.Errorf("查询用户失败: %w", result.Error)
	}

	// 如果更新了用户名，检查是否与其他用户冲突
	if user.Username != existingUser.Username {
		var count int64
		s.DB.Model(&models.User{}).Where("username = ? AND id != ?", user.Username, user.ID).Count(&count)
		if count > 0 {
			return errors.New("用户名已被其他用户使用")
		}
	}

	// 如果更新了邮箱，检查是否与其他用户冲突
	if user.Email != existingUser.Email {
		var count int64
		s.DB.Model(&models.User{}).Where("email = ? AND id != ?", user.Email, user.ID).Count(&count)
		if count > 0 {
			return errors.New("邮箱已被其他用户使用")
		}
	}

	// 更新用户信息
	result := s.DB.Model(user).Updates(map[string]interface{}{
		"username": user.Username,
		"email":    user.Email,
		"nickname": user.Nickname,
		"avatar":   user.Avatar,
		"role":     user.Role,
		"status":   user.Status,
	})

	// 如果密码不为空，则更新密码
	if user.Password != "" {
		s.DB.Model(user).Update("password", user.Password)
	}

	if result.Error != nil {
		return fmt.Errorf("更新用户失败: %w", result.Error)
	}
	return nil
}

// DeleteUser 删除用户
func (s *UserService) DeleteUser(id uint) error {
	// 检查用户是否存在
	var user models.User
	if result := s.DB.First(&user, id); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return fmt.Errorf("查询用户失败: %w", result.Error)
	}

	// 软删除用户
	result := s.DB.Delete(&user)
	if result.Error != nil {
		return fmt.Errorf("删除用户失败: %w", result.Error)
	}
	return nil
}
