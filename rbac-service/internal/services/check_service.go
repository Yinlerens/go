// internal/services/check_service.go
package services

import (
	"rbac-service/internal/repositories"
	"time"
)

// CheckService 权限检查服务接口
type CheckService interface {
	CheckPermission(userID, permissionKey string) (bool, error)
	GetUserPermissions(userID, permissionType string) ([]map[string]interface{}, error)
	ClearUserPermissionCache(userID string) error
}

// checkService 权限检查服务实现
type checkService struct {
	userRoleRepo   repositories.UserRoleRepository
	rolePermRepo   repositories.RolePermissionRepository
	permissionRepo repositories.PermissionRepository
	cache          repositories.Cache
	cacheExpiry    time.Duration
}

// NewCheckService 创建权限检查服务实例
func NewCheckService(
	userRoleRepo repositories.UserRoleRepository,
	rolePermRepo repositories.RolePermissionRepository,
	permissionRepo repositories.PermissionRepository,
	cache repositories.Cache,
	cacheExpiry time.Duration,
) CheckService {
	return &checkService{
		userRoleRepo:   userRoleRepo,
		rolePermRepo:   rolePermRepo,
		permissionRepo: permissionRepo,
		cache:          cache,
		cacheExpiry:    cacheExpiry,
	}
}

// getUserPermissionKeys 获取用户所有权限的Key
func (s *checkService) getUserPermissionKeys(userID string) ([]string, error) {
	// 尝试从缓存获取
	cacheKey := "user_permissions:" + userID
	if cachedPerms, found := s.cache.Get(cacheKey); found {
		return cachedPerms.([]string), nil
	}

	// 获取用户的所有角色
	roleKeys, err := s.userRoleRepo.FindRoleKeysByUserID(userID)
	if err != nil {
		return nil, err
	}

	// 如果用户没有角色，返回空结果
	if len(roleKeys) == 0 {
		return []string{}, nil
	}

	// 获取这些角色拥有的所有权限
	permKeys, err := s.rolePermRepo.FindPermissionKeysByRoleKeys(roleKeys)
	if err != nil {
		return nil, err
	}

	// 缓存结果
	s.cache.Set(cacheKey, permKeys, s.cacheExpiry)

	return permKeys, nil
}

// CheckPermission 检查用户是否拥有特定权限
func (s *checkService) CheckPermission(userID, permissionKey string) (bool, error) {
	// 获取用户所有权限
	permKeys, err := s.getUserPermissionKeys(userID)
	if err != nil {
		return false, err
	}

	// 检查是否包含目标权限
	for _, key := range permKeys {
		if key == permissionKey {
			return true, nil
		}
	}

	return false, nil
}

// GetUserPermissions 获取用户所有权限（可按类型过滤）
func (s *checkService) GetUserPermissions(userID, permissionType string) ([]map[string]interface{}, error) {
	// 获取用户所有权限的Key
	permKeys, err := s.getUserPermissionKeys(userID)
	if err != nil {
		return nil, err
	}

	// 如果用户没有权限，返回空结果
	if len(permKeys) == 0 {
		return []map[string]interface{}{}, nil
	}

	// 获取权限详细信息
	permissions, err := s.permissionRepo.FindByKeys(permKeys, permissionType)
	if err != nil {
		return nil, err
	}

	// 转换为响应格式
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

// ClearUserPermissionCache 清除用户权限缓存
func (s *checkService) ClearUserPermissionCache(userID string) error {
	cacheKey := "user_permissions:" + userID
	s.cache.Delete(cacheKey)
	return nil
}
