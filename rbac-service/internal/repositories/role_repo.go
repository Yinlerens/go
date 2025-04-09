// internal/repositories/role_repo.go
package repositories

import (
	"gorm.io/gorm"
	"rbac-service/internal/models"
)

// RoleRepository 角色数据访问接口
type RoleRepository interface {
	Create(role *models.Role) error
	FindByKey(roleKey string) (*models.Role, error)
	FindAll(page, pageSize int) ([]*models.Role, int64, error)
	Update(role *models.Role) error
	Delete(roleKey string) error
}

// roleRepository 角色数据访问实现
type roleRepository struct {
	db *gorm.DB
}

// NewRoleRepository 创建角色仓库实例
func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepository{db}
}

// Create 创建角色
func (r *roleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

// FindByKey 根据Key查找角色
func (r *roleRepository) FindByKey(roleKey string) (*models.Role, error) {
	var role models.Role
	err := r.db.Where("role_key = ?", roleKey).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// FindAll 获取所有角色（带分页）
func (r *roleRepository) FindAll(page, pageSize int) ([]*models.Role, int64, error) {
	var roles []*models.Role
	var total int64

	// 计算总记录数
	if err := r.db.Model(&models.Role{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 查询分页数据
	offset := (page - 1) * pageSize
	if err := r.db.Offset(offset).Limit(pageSize).Find(&roles).Error; err != nil {
		return nil, 0, err
	}

	return roles, total, nil
}

// Update 更新角色
func (r *roleRepository) Update(role *models.Role) error {
	return r.db.Save(role).Error
}

// Delete 删除角色
func (r *roleRepository) Delete(roleKey string) error {
	return r.db.Where("role_key = ?", roleKey).Delete(&models.Role{}).Error
}
