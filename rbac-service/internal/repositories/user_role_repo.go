// internal/repositories/user_role_repo.go
package repositories

import (
	"gorm.io/gorm"
	"rbac-service/internal/models"
)

// UserRoleRepository 用户-角色关联数据访问接口
type UserRoleRepository interface {
	Create(userRole *models.UserRole) error
	FindByUserIDAndRoleKey(userID, roleKey string) (*models.UserRole, error)
	FindByUserID(userID string) ([]*models.UserRole, error)
	FindByRoleKey(roleKey string) ([]*models.UserRole, error)
	FindRoleKeysByUserID(userID string) ([]string, error)
	DeleteByUserIDAndRoleKey(userID, roleKey string) error
	DeleteByUserIDAndRoleKeys(userID string, roleKeys []string) error
	DeleteByRoleKey(roleKey string) error
	BatchCreate(userRoles []*models.UserRole) error
}

// userRoleRepository 用户-角色关联数据访问实现
type userRoleRepository struct {
	db *gorm.DB
}

// NewUserRoleRepository 创建用户-角色关联仓库实例
func NewUserRoleRepository(db *gorm.DB) UserRoleRepository {
	return &userRoleRepository{db}
}

// Create 创建用户-角色关联
func (r *userRoleRepository) Create(userRole *models.UserRole) error {
	return r.db.Create(userRole).Error
}

// FindByUserIDAndRoleKey 查找特定用户和角色的关联
func (r *userRoleRepository) FindByUserIDAndRoleKey(userID, roleKey string) (*models.UserRole, error) {
	var userRole models.UserRole
	err := r.db.Where("user_id = ? AND role_key = ?", userID, roleKey).First(&userRole).Error
	if err != nil {
		return nil, err
	}
	return &userRole, nil
}

// FindByUserID 查找用户的所有角色关联
func (r *userRoleRepository) FindByUserID(userID string) ([]*models.UserRole, error) {
	var userRoles []*models.UserRole
	err := r.db.Where("user_id = ?", userID).Find(&userRoles).Error
	if err != nil {
		return nil, err
	}
	return userRoles, nil
}

// FindRoleKeysByUserID 获取用户拥有的所有角色Key
func (r *userRoleRepository) FindRoleKeysByUserID(userID string) ([]string, error) {
	var roleKeys []string
	err := r.db.Model(&models.UserRole{}).
		Where("user_id = ?", userID).
		Pluck("role_key", &roleKeys).Error
	if err != nil {
		return nil, err
	}
	return roleKeys, nil
}

// DeleteByUserIDAndRoleKey 删除特定用户和角色的关联
func (r *userRoleRepository) DeleteByUserIDAndRoleKey(userID, roleKey string) error {
	return r.db.Where("user_id = ? AND role_key = ?", userID, roleKey).Delete(&models.UserRole{}).Error
}

// DeleteByUserIDAndRoleKeys 批量删除用户与多个角色的关联
func (r *userRoleRepository) DeleteByUserIDAndRoleKeys(userID string, roleKeys []string) error {
	return r.db.Where("user_id = ? AND role_key IN ?", userID, roleKeys).Delete(&models.UserRole{}).Error
}

// DeleteByRoleKey 删除角色的所有用户关联
func (r *userRoleRepository) DeleteByRoleKey(roleKey string) error {
	return r.db.Where("role_key = ?", roleKey).Delete(&models.UserRole{}).Error
}

// BatchCreate 批量创建用户-角色关联
func (r *userRoleRepository) BatchCreate(userRoles []*models.UserRole) error {
	return r.db.CreateInBatches(userRoles, len(userRoles)).Error
}

// FindByRoleKey 根据角色Key查找所有关联的用户角色记录
func (r *userRoleRepository) FindByRoleKey(roleKey string) ([]*models.UserRole, error) {
	var userRoles []*models.UserRole
	err := r.db.Where("role_key = ?", roleKey).Find(&userRoles).Error
	if err != nil {
		return nil, err
	}
	return userRoles, nil
}
