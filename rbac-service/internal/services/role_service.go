// internal/services/role_service.go
package services

import (
	"audit-sdk/client"
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"regexp"
	"time"
)

// RoleService 角色服务接口
type RoleService interface {
	CreateRole(roleKey, name, description string) (*models.Role, error)
	GetRoles(page, pageSize int) ([]*models.Role, int64, error)
	UpdateRole(roleKey, name, description string) error
	DeleteRole(roleKey string) error
}

// roleService 角色服务实现
type roleService struct {
	roleRepo     repositories.RoleRepository
	userRoleRepo repositories.UserRoleRepository
	rolePermRepo repositories.RolePermissionRepository
	auditClient  client.Client
}

// NewRoleService 创建角色服务实例
func NewRoleService(
	roleRepo repositories.RoleRepository,
	userRoleRepo repositories.UserRoleRepository,
	rolePermRepo repositories.RolePermissionRepository,
	auditClient client.Client,
) RoleService {
	return &roleService{
		roleRepo:     roleRepo,
		userRoleRepo: userRoleRepo,
		rolePermRepo: rolePermRepo,
		auditClient:  auditClient,
	}
}

// isValidRoleKey 验证角色Key是否合法
func isValidRoleKey(roleKey string) bool {
	pattern := `^[a-zA-Z0-9_]+$`
	match, _ := regexp.MatchString(pattern, roleKey)
	return match
}

// CreateRole 创建角色
func (s *roleService) CreateRole(roleKey, name, description string) (*models.Role, error) {
	// 验证roleKey格式
	if !isValidRoleKey(roleKey) {
		return nil, errors.New("角色Key格式无效")
	}

	// 检查角色是否已存在
	existingRole, err := s.roleRepo.FindByKey(roleKey)
	if err == nil && existingRole != nil {
		// 记录创建失败审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				errors.New("角色Key已存在"),
				map[string]interface{}{
					"role_key":    roleKey,
					"name":        name,
					"description": description,
					"operation":   "CREATE",
				},
			)
		}
		return nil, errors.New("角色Key已存在")
	}

	// 创建角色
	role := &models.Role{
		RoleKey:     roleKey,
		Name:        name,
		Description: description,
	}

	if err := s.roleRepo.Create(role); err != nil {
		if s.auditClient != nil {
			s.auditClient.LogError(
				err,
				map[string]interface{}{
					"role_key":    roleKey,
					"name":        name,
					"description": description,
					"operation":   "CREATE",
				},
			)
		}
		return nil, err
	}
	// 记录成功审计
	if s.auditClient != nil {
		s.auditClient.Log(&client.AuditEvent{
			EventType:    string(client.EventRoleCreated),
			Timestamp:    time.Now().UnixNano() / int64(time.Millisecond),
			ServiceName:  "rbac-service",
			ResourceType: "ROLE",
			ResourceID:   roleKey,
			Operation:    "CREATE",
			Result:       string(client.ResultSuccess),
			Details: map[string]interface{}{
				"role_key":    roleKey,
				"name":        name,
				"description": description,
			},
		})
	}
	return role, nil
}

// GetRoles 获取所有角色
func (s *roleService) GetRoles(page, pageSize int) ([]*models.Role, int64, error) {
	return s.roleRepo.FindAll(page, pageSize)
}

// UpdateRole 更新角色
func (s *roleService) UpdateRole(roleKey, name, description string) error {
	// 查找角色
	role, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				errors.New("角色不存在"),
				map[string]interface{}{
					"role_key":    roleKey,
					"name":        name,
					"description": description,
					"operation":   "UPDATE",
				},
			)
		}
		return errors.New("角色不存在")
	}
	// 保存原始数据用于审计
	oldRole := &models.Role{
		RoleKey:     role.RoleKey,
		Name:        role.Name,
		Description: role.Description,
	}
	// 更新角色
	if name != "" {
		role.Name = name
	}
	if description != "" {
		role.Description = description
	}

	if err := s.roleRepo.Update(role); err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				err,
				map[string]interface{}{
					"role_key":    roleKey,
					"name":        name,
					"description": description,
					"operation":   "UPDATE",
				},
			)
		}
		return err
	}
	// 记录成功审计
	if s.auditClient != nil {
		s.auditClient.Log(&client.AuditEvent{
			EventType:    string(client.EventRoleUpdated),
			Timestamp:    time.Now().UnixNano() / int64(time.Millisecond),
			ServiceName:  "rbac-service",
			ResourceType: "ROLE",
			ResourceID:   roleKey,
			Operation:    "UPDATE",
			Result:       string(client.ResultSuccess),
			Details: map[string]interface{}{
				"before": map[string]interface{}{
					"name":        oldRole.Name,
					"description": oldRole.Description,
				},
				"after": map[string]interface{}{
					"name":        role.Name,
					"description": role.Description,
				},
			},
		})
	}

	return nil
}

// DeleteRole 删除角色
func (s *roleService) DeleteRole(roleKey string) error {
	// 查找角色
	role, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				errors.New("角色不存在"),
				map[string]interface{}{
					"role_key":  roleKey,
					"operation": "DELETE",
				},
			)
		}
		return errors.New("角色不存在")
	}
	// 保存原始数据用于审计
	oldRole := &models.Role{
		RoleKey:     role.RoleKey,
		Name:        role.Name,
		Description: role.Description,
	}
	// 删除关联的用户-角色记录
	if err := s.userRoleRepo.DeleteByRoleKey(roleKey); err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				err,
				map[string]interface{}{
					"role_key":  roleKey,
					"operation": "DELETE",
					"step":      "删除用户-角色关联",
				},
			)
		}

		return err
	}

	// 删除关联的角色-权限记录
	if err := s.rolePermRepo.DeleteByRoleKey(roleKey); err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				err,
				map[string]interface{}{
					"role_key":  roleKey,
					"operation": "DELETE",
					"step":      "删除角色-权限关联",
				},
			)
		}

		return err
	}

	// 删除角色
	if err := s.roleRepo.Delete(roleKey); err != nil {
		// 记录错误审计
		if s.auditClient != nil {
			s.auditClient.LogError(
				err,
				map[string]interface{}{
					"role_key":  roleKey,
					"operation": "DELETE",
					"step":      "删除角色",
				},
			)
		}
		return err
	}
	// 记录成功审计
	if s.auditClient != nil {
		s.auditClient.Log(&client.AuditEvent{
			EventType:    string(client.EventRoleDeleted),
			Timestamp:    time.Now().UnixNano() / int64(time.Millisecond),
			ServiceName:  "rbac-service",
			ResourceType: "ROLE",
			ResourceID:   roleKey,
			Operation:    "DELETE",
			Result:       string(client.ResultSuccess),
			Details: map[string]interface{}{
				"deleted_role": map[string]interface{}{
					"role_key":    oldRole.RoleKey,
					"name":        oldRole.Name,
					"description": oldRole.Description,
				},
			},
		})
	}
	return nil
}
