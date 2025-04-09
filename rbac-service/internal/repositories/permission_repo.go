// internal/repositories/permission_repo.go
package repositories

import (
	"gorm.io/gorm"
	"rbac-service/internal/models"
)

// PermissionRepository 权限数据访问接口
type PermissionRepository interface {
	Create(permission *models.Permission) error
	FindByKey(permissionKey string) (*models.Permission, error)
	FindAll(page, pageSize int, permType string) ([]*models.Permission, int64, error)
	FindByKeys(permissionKeys []string, permType string) ([]*models.Permission, error)
	Update(permission *models.Permission) error
	Delete(permissionKey string) error
}

// permissionRepository 权限数据访问实现
type permissionRepository struct {
	db *gorm.DB
}

// NewPermissionRepository 创建权限仓库实例
func NewPermissionRepository(db *gorm.DB) PermissionRepository {
	return &permissionRepository{db}
}

// Create 创建权限
func (r *permissionRepository) Create(permission *models.Permission) error {
	return r.db.Create(permission).Error
}

// FindByKey 根据Key查找权限
func (r *permissionRepository) FindByKey(permissionKey string) (*models.Permission, error) {
	var permission models.Permission
	err := r.db.Where("permission_key = ?", permissionKey).First(&permission).Error
	if err != nil {
		return nil, err
	}
	return &permission, nil
}

// FindAll 获取所有权限（带分页和类型过滤）
func (r *permissionRepository) FindAll(page, pageSize int, permType string) ([]*models.Permission, int64, error) {
	var permissions []*models.Permission
	var total int64

	query := r.db.Model(&models.Permission{})

	// 按类型过滤
	if permType != "" {
		query = query.Where("type = ?", permType)
	}

	// 计算总记录数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 查询分页数据
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&permissions).Error; err != nil {
		return nil, 0, err
	}

	return permissions, total, nil
}

// FindByKeys 通过一组Key查找权限
func (r *permissionRepository) FindByKeys(permissionKeys []string, permType string) ([]*models.Permission, error) {
	var permissions []*models.Permission

	query := r.db.Where("permission_key IN ?", permissionKeys)

	// 按类型过滤
	if permType != "" {
		query = query.Where("type = ?", permType)
	}

	if err := query.Find(&permissions).Error; err != nil {
		return nil, err
	}

	return permissions, nil
}

// Update 更新权限
func (r *permissionRepository) Update(permission *models.Permission) error {
	return r.db.Save(permission).Error
}

// Delete 删除权限
func (r *permissionRepository) Delete(permissionKey string) error {
	return r.db.Where("permission_key = ?", permissionKey).Delete(&models.Permission{}).Error
}
