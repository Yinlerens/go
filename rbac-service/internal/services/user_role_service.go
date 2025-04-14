// internal/services/user_role_service.go
package services

import (
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
)

// UserRoleService 用户-角色服务接口
type UserRoleService interface {
	AssignRolesToUser(userID string, roleKeys []string) error
	UnassignRolesFromUser(userID string, roleKeys []string) error
	GetUserRoles(userID string) ([]map[string]interface{}, error)
	GetBatchUserRoles(userIDs []string) (map[string][]map[string]interface{}, error)
}

// userRoleService 用户-角色服务实现
type userRoleService struct {
	userRoleRepo repositories.UserRoleRepository
	roleRepo     repositories.RoleRepository
	authClient   AuthClient
	checkService CheckService
}

// NewUserRoleService 创建用户-角色服务实例
func NewUserRoleService(
	userRoleRepo repositories.UserRoleRepository,
	roleRepo repositories.RoleRepository,
	authClient AuthClient,
	checkService CheckService,
) UserRoleService {
	return &userRoleService{
		userRoleRepo: userRoleRepo,
		roleRepo:     roleRepo,
		authClient:   authClient,
		checkService: checkService,
	}
}

// AssignRolesToUser 分配角色给用户
func (s *userRoleService) AssignRolesToUser(userID string, roleKeys []string) error {
	// 验证用户ID
	isValid, err := s.authClient.ValidateUser(userID)
	if err != nil || !isValid {
		return errors.New("用户不存在或无效")
	}

	// 验证所有角色是否存在
	for _, roleKey := range roleKeys {
		_, err := s.roleRepo.FindByKey(roleKey)
		if err != nil {
			return errors.New("角色不存在:" + roleKey)
		}
	}

	// 获取用户当前的角色
	existingRoleKeys, err := s.userRoleRepo.FindRoleKeysByUserID(userID)
	if err != nil {
		return err
	}

	// 过滤出需要新分配的角色
	var newRoleKeys []string
	for _, roleKey := range roleKeys {
		exists := false
		for _, existingKey := range existingRoleKeys {
			if roleKey == existingKey {
				exists = true
				break
			}
		}
		if !exists {
			newRoleKeys = append(newRoleKeys, roleKey)
		}
	}

	// 如果没有需要新分配的角色，直接返回成功
	if len(newRoleKeys) == 0 {
		return nil
	}

	// 批量创建用户-角色关联
	userRoles := make([]*models.UserRole, len(newRoleKeys))
	for i, roleKey := range newRoleKeys {
		userRoles[i] = &models.UserRole{
			UserID:  userID,
			RoleKey: roleKey,
		}
	}

	if err := s.userRoleRepo.BatchCreate(userRoles); err != nil {
		return err
	}

	// 清除用户权限缓存
	s.checkService.ClearUserPermissionCache(userID)

	return nil
}

// UnassignRolesFromUser 从用户中移除角色
func (s *userRoleService) UnassignRolesFromUser(userID string, roleKeys []string) error {
	// 执行删除
	if err := s.userRoleRepo.DeleteByUserIDAndRoleKeys(userID, roleKeys); err != nil {
		return err
	}

	// 清除用户权限缓存
	s.checkService.ClearUserPermissionCache(userID)

	return nil
}

// GetUserRoles 获取用户的所有角色
func (s *userRoleService) GetUserRoles(userID string) ([]map[string]interface{}, error) {
	// 获取用户的角色Key
	roleKeys, err := s.userRoleRepo.FindRoleKeysByUserID(userID)
	if err != nil {
		return nil, err
	}

	// 如果用户没有角色，返回空列表
	if len(roleKeys) == 0 {
		return []map[string]interface{}{}, nil
	}

	// 构建结果
	result := make([]map[string]interface{}, 0, len(roleKeys))
	for _, roleKey := range roleKeys {
		role, err := s.roleRepo.FindByKey(roleKey)
		if err != nil {
			continue // 跳过不存在的角色
		}

		result = append(result, map[string]interface{}{
			"role_key":    role.RoleKey,
			"name":        role.Name,
			"description": role.Description,
		})
	}

	return result, nil
}

// 批量查询用户所属角色
func (s *userRoleService) GetBatchUserRoles(userIDs []string) (map[string][]map[string]interface{}, error) {
	result := make(map[string][]map[string]interface{})

	for _, userID := range userIDs {
		roles, err := s.GetUserRoles(userID)
		if err != nil {
			// 如果某个用户查询失败，可以选择跳过或返回空角色列表
			result[userID] = []map[string]interface{}{}
			continue
		}
		result[userID] = roles
	}

	return result, nil
}