// internal/services/permission_service.go
package services

import (
	"audit-sdk/client"
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"regexp"
)

// PermissionService 权限服务接口
type PermissionService interface {
	CreatePermission(permissionKey, name, permType, description string) (*models.Permission, error)
	GetPermissions(page, pageSize int, permType string) ([]*models.Permission, int64, error)
	UpdatePermission(permissionKey, name, permType, description string) error
	DeletePermission(permissionKey string) error
}

// permissionService 权限服务实现
type permissionService struct {
	permRepo     repositories.PermissionRepository
	rolePermRepo repositories.RolePermissionRepository
	auditClient  client.Client
}

// NewPermissionService 创建权限服务实例
func NewPermissionService(
	permRepo repositories.PermissionRepository,
	rolePermRepo repositories.RolePermissionRepository,
	auditClient client.Client,

) PermissionService {
	return &permissionService{
		permRepo:     permRepo,
		rolePermRepo: rolePermRepo,
		auditClient:  auditClient,
	}
}

// isValidPermissionKey 验证权限Key是否合法
func isValidPermissionKey(permissionKey string) bool {
	pattern := `^[a-zA-Z0-9_:.-]+$`
	match, _ := regexp.MatchString(pattern, permissionKey)
	return match
}

// CreatePermission 创建权限
func (s *permissionService) CreatePermission(permissionKey, name, permType, description string) (*models.Permission, error) {
	// 验证permissionKey格式
	if !isValidPermissionKey(permissionKey) {
		return nil, errors.New("权限Key格式无效")
	}

	// 检查权限是否已存在
	existingPerm, err := s.permRepo.FindByKey(permissionKey)
	if err == nil && existingPerm != nil {
		return nil, errors.New("权限Key已存在")
	}

	// 创建权限
	permission := &models.Permission{
		PermissionKey: permissionKey,
		Name:          name,
		Type:          permType,
		Description:   description,
	}

	if err := s.permRepo.Create(permission); err != nil {
		return nil, err
	}
	return permission, nil
}

// GetPermissions 获取所有权限
func (s *permissionService) GetPermissions(page, pageSize int, permType string) ([]*models.Permission, int64, error) {
	return s.permRepo.FindAll(page, pageSize, permType)
}

// UpdatePermission 更新权限
func (s *permissionService) UpdatePermission(permissionKey, name, permType, description string) error {
	// 查找权限
	permission, err := s.permRepo.FindByKey(permissionKey)
	if err != nil {
		return errors.New("权限不存在")
	}
	// 更新权限
	if name != "" {
		permission.Name = name
	}
	if permType != "" {
		permission.Type = permType
	}
	if description != "" {
		permission.Description = description
	}

	if err := s.permRepo.Update(permission); err != nil {
		return err
	}
	return nil
}

// DeletePermission 删除权限
func (s *permissionService) DeletePermission(permissionKey string) error {
	// 查找权限
	_, err := s.permRepo.FindByKey(permissionKey)
	if err != nil {
		return errors.New("权限不存在")
	}

	// 删除关联的角色-权限记录
	if err := s.rolePermRepo.DeleteByPermissionKey(permissionKey); err != nil {
		return err
	}

	// 删除权限
	if err := s.permRepo.Delete(permissionKey); err != nil {
		return err
	}

	return nil
}
