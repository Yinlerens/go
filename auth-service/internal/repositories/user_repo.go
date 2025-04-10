// internal/repositories/user_repo.go
package repositories

import (
	"auth-service/internal/models"
	"gorm.io/gorm"
)

// UserRepository 用户数据访问层接口
type UserRepository interface {
	Create(user *models.User) error
	FindByUsername(username string) (*models.User, error)
	FindByUserID(userID string) (*models.User, error)
	UpdateStatus(userID string, status string) error
	FindAll(page, pageSize int, username string) ([]*models.User, int64, error)
}

// userRepository 用户数据访问层实现
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户数据访问层实例
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

// Create 创建新用户
func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// FindByUsername 根据用户名查找用户
func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByUserID 根据用户ID查找用户
func (r *userRepository) FindByUserID(userID string) (*models.User, error) {
	var user models.User
	err := r.db.Where("user_id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateStatus 更新用户状态
func (r *userRepository) UpdateStatus(userID string, status string) error {
	return r.db.Model(&models.User{}).Where("user_id = ?", userID).Update("status", status).Error
}

// FindAll 查询所有用户
func (r *userRepository) FindAll(page, pageSize int, username string) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64

	query := r.db.Model(&models.User{})

	// Apply username filter if provided
	if username != "" {
		query = query.Where("username LIKE ?", "%"+username+"%")
	}

	// Count total records matching the filter
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}