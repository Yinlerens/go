// internal/services/permission_service.go
package services

import (
	"errors"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"rbac-service/internal/utils"
	"regexp"
)

// PermissionService 权限服务接口
type PermissionService interface {
	CreatePermission(permissionKey, name, permType, description string, actorID, actorType string) (*models.Permission, error)
	GetPermissions(page, pageSize int, permType string) ([]*models.Permission, int64, error)
	UpdatePermission(permissionKey, name, permType, description string, actorID, actorType string) error
	DeletePermission(permissionKey string, actorID, actorType string) error
}

// permissionService 权限服务实现
type permissionService struct {
	permRepo     repositories.PermissionRepository
	rolePermRepo repositories.RolePermissionRepository
	auditRepo    repositories.AuditLogRepository
	auditCreator utils.AuditLogCreator
}

// NewPermissionService 创建权限服务实例
func NewPermissionService(
	permRepo repositories.PermissionRepository,
	rolePermRepo repositories.RolePermissionRepository,
	auditRepo repositories.AuditLogRepository,
	auditCreator utils.AuditLogCreator,
) PermissionService {
	return &permissionService{
		permRepo:     permRepo,
		rolePermRepo: rolePermRepo,
		auditRepo:    auditRepo,
		auditCreator: auditCreator,
	}
}

// isValidPermissionKey 验证权限Key是否合法
func isValidPermissionKey(permissionKey string) bool {
	pattern := `^[a-zA-Z0-9_:.-]+$`
	match, _ := regexp.MatchString(pattern, permissionKey)
	return match
}

// CreatePermission 创建权限
func (s *permissionService) CreatePermission(permissionKey, name, permType, description string, actorID, actorType string) (*models.Permission, error) {
	// 验证permissionKey格式
	if !isValidPermissionKey(permissionKey) {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_CREATE", "PERMISSION", permissionKey,
			models.JSON{"error": "权限Key格式无效"},
			"FAILURE", "权限Key格式无效",
		)
		s.auditRepo.Create(auditLog)
		return nil, errors.New("权限Key格式无效")
	}

	// 检查权限是否已存在
	existingPerm, err := s.permRepo.FindByKey(permissionKey)
	if err == nil && existingPerm != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_CREATE", "PERMISSION", permissionKey,
			models.JSON{"error": "权限Key已存在"},
			"FAILURE", "权限Key已存在",
		)
		s.auditRepo.Create(auditLog)
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
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_CREATE", "PERMISSION", permissionKey,
			models.JSON{"error": err.Error()},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return nil, err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "PERMISSION_CREATE", "PERMISSION", permissionKey,
		models.JSON{
			"permission_key": permissionKey,
			"name":           name,
			"type":           permType,
			"description":    description,
		},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return permission, nil
}

// GetPermissions 获取所有权限
func (s *permissionService) GetPermissions(page, pageSize int, permType string) ([]*models.Permission, int64, error) {
	return s.permRepo.FindAll(page, pageSize, permType)
}

// UpdatePermission 更新权限
func (s *permissionService) UpdatePermission(permissionKey, name, permType, description string, actorID, actorType string) error {
	// 查找权限
	permission, err := s.permRepo.FindByKey(permissionKey)
	if err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_UPDATE", "PERMISSION", permissionKey,
			models.JSON{"error": "权限不存在"},
			"FAILURE", "权限不存在",
		)
		s.auditRepo.Create(auditLog)
		return errors.New("权限不存在")
	}

	// 记录旧值
	oldPerm := map[string]interface{}{
		"name":        permission.Name,
		"type":        permission.Type,
		"description": permission.Description,
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
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_UPDATE", "PERMISSION", permissionKey,
			models.JSON{
				"error": err.Error(),
				"old":   oldPerm,
			},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "PERMISSION_UPDATE", "PERMISSION", permissionKey,
		models.JSON{
			"old": oldPerm,
			"new": map[string]interface{}{
				"name":        permission.Name,
				"type":        permission.Type,
				"description": permission.Description,
			},
		},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return nil
}

// DeletePermission 删除权限
func (s *permissionService) DeletePermission(permissionKey string, actorID, actorType string) error {
	// 查找权限
	_, err := s.permRepo.FindByKey(permissionKey)
	if err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_DELETE", "PERMISSION", permissionKey,
			models.JSON{"error": "权限不存在"},
			"FAILURE", "权限不存在",
		)
		s.auditRepo.Create(auditLog)
		return errors.New("权限不存在")
	}

	// 删除关联的角色-权限记录
	if err := s.rolePermRepo.DeleteByPermissionKey(permissionKey); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_DELETE", "PERMISSION", permissionKey,
			models.JSON{"error": "删除角色-权限关联失败"},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 删除权限
	if err := s.permRepo.Delete(permissionKey); err != nil {
		// 创建审计日志
		auditLog := s.auditCreator.CreateAuditLog(
			actorID, actorType, "PERMISSION_DELETE", "PERMISSION", permissionKey,
			models.JSON{"error": "删除权限失败"},
			"FAILURE", err.Error(),
		)
		s.auditRepo.Create(auditLog)
		return err
	}

	// 创建成功审计日志
	auditLog := s.auditCreator.CreateAuditLog(
		actorID, actorType, "PERMISSION_DELETE", "PERMISSION", permissionKey,
		models.JSON{"permission_key": permissionKey},
		"SUCCESS", "",
	)
	s.auditRepo.Create(auditLog)

	return nil
}
