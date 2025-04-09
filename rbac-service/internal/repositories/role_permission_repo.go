// internal/repositories/role_permission_repo.go
package repositories

import (
	"gorm.io/gorm"
	"rbac-service/internal/models"
)

// RolePermissionRepository 角色-权限关联数据访问接口
type RolePermissionRepository interface {
	Create(rolePermission *models.RolePermission) error
	FindByRoleKeyAndPermissionKey(roleKey, permissionKey string) (*models.RolePermission, error)
	FindByRoleKey(roleKey string) ([]*models.RolePermission, error)
	FindPermissionKeysByRoleKeys(roleKeys []string) ([]string, error)
	DeleteByRoleKeyAndPermissionKey(roleKey, permissionKey string) error
	DeleteByRoleKeyAndPermissionKeys(roleKey string, permissionKeys []string) error
	DeleteByRoleKey(roleKey string) error
	DeleteByPermissionKey(permissionKey string) error
	BatchCreate(rolePermissions []*models.RolePermission) error
}

// rolePermissionRepository 角色-权限关联数据访问实现
type rolePermissionRepository struct {
	db *gorm.DB
}

// NewRolePermissionRepository 创建角色-权限关联仓库实例
func NewRolePermissionRepository(db *gorm.DB) RolePermissionRepository {
	return &rolePermissionRepository{db}
}

// Create 创建角色-权限关联
func (r *rolePermissionRepository) Create(rolePermission *models.RolePermission) error {
	return r.db.Create(rolePermission).Error
}

// FindByRoleKeyAndPermissionKey 查找特定角色和权限的关联
func (r *rolePermissionRepository) FindByRoleKeyAndPermissionKey(roleKey, permissionKey string) (*models.RolePermission, error) {
	var rolePermission models.RolePermission
	err := r.db.Where("role_key = ? AND permission_key = ?", roleKey, permissionKey).First(&rolePermission).Error
	if err != nil {
		return nil, err
	}
	return &rolePermission, nil
}

// FindByRoleKey 查找角色的所有权限关联
func (r *rolePermissionRepository) FindByRoleKey(roleKey string) ([]*models.RolePermission, error) {
	var rolePermissions []*models.RolePermission
	err := r.db.Where("role_key = ?", roleKey).Find(&rolePermissions).Error
	if err != nil {
		return nil, err
	}
	return rolePermissions, nil
}

// FindPermissionKeysByRoleKeys 获取多个角色拥有的所有权限Key
func (r *rolePermissionRepository) FindPermissionKeysByRoleKeys(roleKeys []string) ([]string, error) {
	var permissionKeys []string
	err := r.db.Model(&models.RolePermission{}).
		Where("role_key IN ?", roleKeys).
		Distinct().
		Pluck("permission_key", &permissionKeys).Error
	if err != nil {
		return nil, err
	}
	return permissionKeys, nil
}

// DeleteByRoleKeyAndPermissionKey 删除特定角色和权限的关联
func (r *rolePermissionRepository) DeleteByRoleKeyAndPermissionKey(roleKey, permissionKey string) error {
	return r.db.Where("role_key = ? AND permission_key = ?", roleKey, permissionKey).Delete(&models.RolePermission{}).Error
}

// DeleteByRoleKeyAndPermissionKeys 批量删除角色与多个权限的关联
func (r *rolePermissionRepository) DeleteByRoleKeyAndPermissionKeys(roleKey string, permissionKeys []string) error {
	return r.db.Where("role_key = ? AND permission_key IN ?", roleKey, permissionKeys).Delete(&models.RolePermission{}).Error
}

// DeleteByRoleKey 删除角色的所有权限关联
func (r *rolePermissionRepository) DeleteByRoleKey(roleKey string) error {
	return r.db.Where("role_key = ?", roleKey).Delete(&models.RolePermission{}).Error
}

// DeleteByPermissionKey 删除权限的所有角色关联
func (r *rolePermissionRepository) DeleteByPermissionKey(permissionKey string) error {
	return r.db.Where("permission_key = ?", permissionKey).Delete(&models.RolePermission{}).Error
}

// BatchCreate 批量创建角色-权限关联
func (r *rolePermissionRepository) BatchCreate(rolePermissions []*models.RolePermission) error {
	return r.db.CreateInBatches(rolePermissions, len(rolePermissions)).Error
}
