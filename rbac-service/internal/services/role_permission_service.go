// internal/services/role_permission_service.go
package services

import (
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
)

// RolePermissionService 角色-权限服务接口
type RolePermissionService interface {
	AssignPermissionsToRole(roleKey string, permissionKeys []string) error
	UnassignPermissionsFromRole(roleKey string, permissionKeys []string) error
	GetRolePermissions(roleKey string) ([]map[string]interface{}, error)
}

// rolePermissionService 角色-权限服务实现
type rolePermissionService struct {
	rolePermRepo repositories.RolePermissionRepository
	roleRepo     repositories.RoleRepository
	permRepo     repositories.PermissionRepository
	userRoleRepo repositories.UserRoleRepository
	checkService CheckService
	cache        repositories.Cache
}

// NewRolePermissionService 创建角色-权限服务实例
func NewRolePermissionService(
	rolePermRepo repositories.RolePermissionRepository,
	roleRepo repositories.RoleRepository,
	permRepo repositories.PermissionRepository,
	userRoleRepo repositories.UserRoleRepository,
	checkService CheckService,
	cache repositories.Cache,
) RolePermissionService {
	return &rolePermissionService{
		rolePermRepo: rolePermRepo,
		roleRepo:     roleRepo,
		permRepo:     permRepo,
		userRoleRepo: userRoleRepo,
		checkService: checkService,
		cache:        cache,
	}
}

// AssignPermissionsToRole 分配权限给角色
func (s *rolePermissionService) AssignPermissionsToRole(roleKey string, permissionKeys []string) error {
	// 验证角色是否存在
	_, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		return errors.New("角色不存在")
	}

	// 验证所有权限是否存在
	for _, permKey := range permissionKeys {
		_, err := s.permRepo.FindByKey(permKey)
		if err != nil {
			return errors.New("权限不存在:" + permKey)
		}
	}

	// 获取角色当前的权限
	existingPermKeys, err := s.getRolePermissionKeys(roleKey)
	if err != nil {
		return err
	}

	// 过滤出需要新分配的权限
	var newPermKeys []string
	for _, permKey := range permissionKeys {
		exists := false
		for _, existingKey := range existingPermKeys {
			if permKey == existingKey {
				exists = true
				break
			}
		}
		if !exists {
			newPermKeys = append(newPermKeys, permKey)
		}
	}

	// 如果没有需要新分配的权限，直接返回成功
	if len(newPermKeys) == 0 {
		return nil
	}

	// 批量创建角色-权限关联
	rolePermissions := make([]*models.RolePermission, len(newPermKeys))
	for i, permKey := range newPermKeys {
		rolePermissions[i] = &models.RolePermission{
			RoleKey:       roleKey,
			PermissionKey: permKey,
		}
	}

	if err := s.rolePermRepo.BatchCreate(rolePermissions); err != nil {
		return err
	}

	// 清除所有拥有此角色的用户的权限缓存
	s.clearCacheForRoleUsers(roleKey)

	return nil
}

// UnassignPermissionsFromRole 从角色中移除权限
func (s *rolePermissionService) UnassignPermissionsFromRole(roleKey string, permissionKeys []string) error {
	// 执行删除
	if err := s.rolePermRepo.DeleteByRoleKeyAndPermissionKeys(roleKey, permissionKeys); err != nil {
		return err
	}

	// 清除所有拥有此角色的用户的权限缓存
	s.clearCacheForRoleUsers(roleKey)

	return nil
}

// GetRolePermissions 获取角色的所有权限
func (s *rolePermissionService) GetRolePermissions(roleKey string) ([]map[string]interface{}, error) {
	// 验证角色是否存在
	_, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		return nil, errors.New("角色不存在")
	}

	// 获取角色的权限Key
	permKeys, err := s.getRolePermissionKeys(roleKey)
	if err != nil {
		return nil, err
	}

	// 如果角色没有权限，返回空列表
	if len(permKeys) == 0 {
		return []map[string]interface{}{}, nil
	}

	// 获取权限详情
	permissions, err := s.permRepo.FindByKeys(permKeys, "")
	if err != nil {
		return nil, err
	}

	// 构建结果
	result := make([]map[string]interface{}, len(permissions))
	for i, perm := range permissions {
		result[i] = map[string]interface{}{
			"permission_key": perm.PermissionKey,
			"name":           perm.Name,
			"type":           perm.Type,
			"description":    perm.Description,
		}
	}

	return result, nil
}

// getRolePermissionKeys 获取角色拥有的所有权限Key
func (s *rolePermissionService) getRolePermissionKeys(roleKey string) ([]string, error) {
	roleKeys := []string{roleKey}
	return s.rolePermRepo.FindPermissionKeysByRoleKeys(roleKeys)
}

// clearCacheForRoleUsers 清除拥有指定角色的所有用户的权限缓存
func (s *rolePermissionService) clearCacheForRoleUsers(roleKey string) {
	// 在实际项目中，可能需要优化这部分逻辑，避免大量缓存失效
	// 这里简单实现：查询所有拥有该角色的用户ID，然后逐个清除缓存

	// 获取拥有该角色的所有用户ID
	userRoles, err := s.userRoleRepo.FindByRoleKey(roleKey)
	if err != nil {
		return
	}

	for _, userRole := range userRoles {
		s.checkService.ClearUserPermissionCache(userRole.UserID)
	}
}