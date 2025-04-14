// internal/services/role_service.go
package services

import (
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"regexp"
)

// RoleService 角色服务接口
type RoleService interface {
	CreateRole(roleKey, name, description string, actorID, actorType string) (*models.Role, error)
	GetRoles(page, pageSize int) ([]*models.Role, int64, error)
	UpdateRole(roleKey, name, description string, actorID, actorType string) error
	DeleteRole(roleKey string, actorID, actorType string) error
}

// roleService 角色服务实现
type roleService struct {
	roleRepo     repositories.RoleRepository
	userRoleRepo repositories.UserRoleRepository
	rolePermRepo repositories.RolePermissionRepository
}

// NewRoleService 创建角色服务实例
func NewRoleService(
	roleRepo repositories.RoleRepository,
	userRoleRepo repositories.UserRoleRepository,
	rolePermRepo repositories.RolePermissionRepository,
) RoleService {
	return &roleService{
		roleRepo:     roleRepo,
		userRoleRepo: userRoleRepo,
		rolePermRepo: rolePermRepo,
	}
}

// isValidRoleKey 验证角色Key是否合法
func isValidRoleKey(roleKey string) bool {
	pattern := `^[a-zA-Z0-9_]+$`
	match, _ := regexp.MatchString(pattern, roleKey)
	return match
}

// CreateRole 创建角色
func (s *roleService) CreateRole(roleKey, name, description string, actorID, actorType string) (*models.Role, error) {
	// 验证roleKey格式
	if !isValidRoleKey(roleKey) {
		return nil, errors.New("角色Key格式无效")
	}

	// 检查角色是否已存在
	existingRole, err := s.roleRepo.FindByKey(roleKey)
	if err == nil && existingRole != nil {
		return nil, errors.New("角色Key已存在")
	}

	// 创建角色
	role := &models.Role{
		RoleKey:     roleKey,
		Name:        name,
		Description: description,
	}

	if err := s.roleRepo.Create(role); err != nil {
		return nil, err
	}

	return role, nil
}

// GetRoles 获取所有角色
func (s *roleService) GetRoles(page, pageSize int) ([]*models.Role, int64, error) {
	return s.roleRepo.FindAll(page, pageSize)
}

// UpdateRole 更新角色
func (s *roleService) UpdateRole(roleKey, name, description string, actorID, actorType string) error {
	// 查找角色
	role, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		return errors.New("角色不存在")
	}

	// 更新角色
	if name != "" {
		role.Name = name
	}
	if description != "" {
		role.Description = description
	}

	if err := s.roleRepo.Update(role); err != nil {
		return err
	}

	return nil
}

// DeleteRole 删除角色
func (s *roleService) DeleteRole(roleKey string, actorID, actorType string) error {
	// 查找角色
	_, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		return errors.New("角色不存在")
	}

	// 删除关联的用户-角色记录
	if err := s.userRoleRepo.DeleteByRoleKey(roleKey); err != nil {
		return err
	}

	// 删除关联的角色-权限记录
	if err := s.rolePermRepo.DeleteByRoleKey(roleKey); err != nil {
		return err
	}

	// 删除角色
	if err := s.roleRepo.Delete(roleKey); err != nil {
		return err
	}

	return nil
}