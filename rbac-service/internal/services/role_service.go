// internal/services/role_service.go
package services

import (
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"rbac-service/internal/utils"
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
	auditRepo    repositories.AuditLogRepository
	auditCreator utils.AuditLogCreator
}

// NewRoleService 创建角色服务实例
func NewRoleService(
	roleRepo repositories.RoleRepository,
	userRoleRepo repositories.UserRoleRepository,
	rolePermRepo repositories.RolePermissionRepository,
	auditRepo repositories.AuditLogRepository,
	auditCreator utils.AuditLogCreator,
) RoleService {
	return &roleService{
		roleRepo:     roleRepo,
		userRoleRepo: userRoleRepo,
		rolePermRepo: rolePermRepo,
		auditRepo:    auditRepo,
		auditCreator: auditCreator,
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
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_CREATE", "ROLE", roleKey,
			models.JSON{"error": "角色Key格式无效"},
			"FAILURE", "角色Key格式无效",
		)
		s.auditRepo.Create(auditLog)
		return nil, errors.New("角色Key格式无效")
	}

	// 检查角色是否已存在
	existingRole, err := s.roleRepo.FindByKey(roleKey)
	if err == nil && existingRole != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_CREATE", "ROLE", roleKey,
			models.JSON{"error": "角色Key已存在"},
			"FAILURE", "角色Key已存在",
		)
		s.auditRepo.Create(auditLog)
		return nil, errors.New("角色Key已存在")
	}

	// 创建角色
	role := &models.Role{
		RoleKey:     roleKey,
		Name:        name,
		Description: description,
	}

	if err := s.roleRepo.Create(role); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_CREATE", "ROLE", roleKey,
			models.JSON{"error": err.Error()},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return nil, err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "ROLE_CREATE", "ROLE", roleKey,
		models.JSON{
			"role_key":    roleKey,
			"name":        name,
			"description": description,
		},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return role, nil
}

// GetRoles 获取所有角色
func (s *roleService) GetRoles(page, pageSize int) ([]*models.Role, int64, error) {
	return s.roleRepo.FindAll(page, pageSize)
}

// UpdateRole 更新角色
func (s *roleService) UpdateRole(roleKey, name, description string) (*models.Role, models.JSON, error) {
	// 查找角色
	role, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		return nil, nil, errors.New("角色不存在")
	}

	// 记录旧值
	oldData := models.JSON{
		"name":        role.Name,
		"description": role.Description,
	}

	// 更新角色
	if name != "" {
		role.Name = name
	}
	if description != "" {
		role.Description = description
	}

	if err := s.roleRepo.Update(role); err != nil {
		return nil, nil, err
	}

	if err := s.roleRepo.Update(role); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_UPDATE", "ROLE", roleKey,
			models.JSON{
				"error": err.Error(),
				"old":   oldRole,
			},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "ROLE_UPDATE", "ROLE", roleKey,
		models.JSON{
			"old": oldRole,
			"new": map[string]interface{}{
				"name":        role.Name,
				"description": role.Description,
			},
		},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return nil
}

// DeleteRole 删除角色
func (s *roleService) DeleteRole(roleKey string, actorID, actorType string) error {
	// 查找角色
	_, err := s.roleRepo.FindByKey(roleKey)
	if err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_DELETE", "ROLE", roleKey,
			models.JSON{"error": "角色不存在"},
			"FAILURE", "角色不存在",
		)
		s.auditRepo.Create(auditLog)
		return errors.New("角色不存在")
	}

	// 删除关联的用户-角色记录
	if err := s.userRoleRepo.DeleteByRoleKey(roleKey); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_DELETE", "ROLE", roleKey,
			models.JSON{"error": "删除用户-角色关联失败"},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 删除关联的角色-权限记录
	if err := s.rolePermRepo.DeleteByRoleKey(roleKey); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_DELETE", "ROLE", roleKey,
			models.JSON{"error": "删除角色-权限关联失败"},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 删除角色
	if err := s.roleRepo.Delete(roleKey); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "ROLE_DELETE", "ROLE", roleKey,
			models.JSON{"error": "删除角色失败"},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "ROLE_DELETE", "ROLE", roleKey,
		models.JSON{"role_key": roleKey},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return nil
}