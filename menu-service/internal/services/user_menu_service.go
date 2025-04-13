// internal/services/user_menu_service.go
package services

import (
	"log"
	"menu-service/internal/models"
	"menu-service/internal/repositories"
	"time"
)

// UserMenuService 用户菜单服务接口
type UserMenuService interface {
	GetUserMenu(userID string) ([]*UserMenuNode, error)
}

// UserMenuNode 用户菜单树节点
type UserMenuNode struct {
	ID       string          `json:"id"`
	Name     string          `json:"name"`
	Path     string          `json:"path"`
	Icon     string          `json:"icon"`
	ParentID string          `json:"parent_id"`
	Order    int             `json:"order"`
	Meta     models.JSON     `json:"meta,omitempty"`
	Children []*UserMenuNode `json:"children"`
}

// userMenuService 用户菜单服务实现
type userMenuService struct {
	menuItemRepo repositories.MenuItemRepository
	rbacClient   RbacClient
	cache        repositories.Cache
	cacheExpiry  time.Duration
}

// NewUserMenuService 创建用户菜单服务实例
func NewUserMenuService(
	menuItemRepo repositories.MenuItemRepository,
	rbacClient RbacClient,
	cache repositories.Cache,
	cacheExpiry time.Duration,
) UserMenuService {
	return &userMenuService{
		menuItemRepo: menuItemRepo,
		rbacClient:   rbacClient,
		cache:        cache,
		cacheExpiry:  cacheExpiry,
	}
}

// GetUserMenu 获取用户菜单
func (s *userMenuService) GetUserMenu(userID string) ([]*UserMenuNode, error) {
	// 尝试从缓存获取
	cacheKey := "user_menu:" + userID
	if cachedMenu, found := s.cache.Get(cacheKey); found {
		return cachedMenu.([]*UserMenuNode), nil
	}

	// 获取用户权限列表
	userPermissions, err := s.rbacClient.GetUserPermissions(userID)
	log.Println("GetUserPermissions", userPermissions)
	if err != nil {
		return nil, err
	}

	// 获取所有菜单项
	allMenuItems, err := s.menuItemRepo.FindAll()
	if err != nil {
		return nil, err
	}

	// 过滤有权限访问的菜单项
	permissionMap := make(map[string]bool)
	for _, perm := range userPermissions {
		permissionMap[perm] = true
	}

	// 找出用户有权限访问的菜单
	var filteredItems []*models.MenuItem
	for _, item := range allMenuItems {
		// 只有启用的菜单才考虑
		if !item.IsEnabled {
			continue
		}

		// 如果菜单没有设置权限，或者用户拥有该菜单的权限
		if item.PermissionKey == "" || permissionMap[item.PermissionKey] {
			filteredItems = append(filteredItems, item)
		}
	}
	// 构建用户菜单树
	userMenuTree := s.buildUserMenuTree(filteredItems)

	// 清理空的父菜单
	userMenuTree = s.pruneEmptyBranches(userMenuTree)

	// 缓存用户菜单
	s.cache.Set(cacheKey, userMenuTree, s.cacheExpiry)

	return userMenuTree, nil
}

// buildUserMenuTree 构建用户菜单树
func (s *userMenuService) buildUserMenuTree(menuItems []*models.MenuItem) []*UserMenuNode {
	// 创建ID到菜单项的映射
	menuMap := make(map[string]*UserMenuNode)
	for _, item := range menuItems {
		menuMap[item.ID] = &UserMenuNode{
			ID:       item.ID,
			Name:     item.Name,
			Path:     item.Path,
			Icon:     item.Icon,
			ParentID: item.ParentID,
			Order:    item.Order,
			Meta:     item.Meta,
			Children: []*UserMenuNode{},
		}
	}

	// 构建树形结构
	var rootNodes []*UserMenuNode
	for _, item := range menuItems {
		node := menuMap[item.ID]
		if item.ParentID == "" {
			rootNodes = append(rootNodes, node)
		} else {
			parent, exists := menuMap[item.ParentID]
			if exists {
				parent.Children = append(parent.Children, node)
			} else {
				// 如果父菜单不在过滤后的列表中，将该节点作为根节点
				rootNodes = append(rootNodes, node)
			}
		}
	}

	return rootNodes
}

// pruneEmptyBranches 裁剪空的分支
func (s *userMenuService) pruneEmptyBranches(nodes []*UserMenuNode) []*UserMenuNode {
	var result []*UserMenuNode

	for _, node := range nodes {
		// 递归处理子节点
		node.Children = s.pruneEmptyBranches(node.Children)

		// 如果节点有子节点或者节点有路径，则保留
		if len(node.Children) > 0 || node.Path != "" {
			result = append(result, node)
		}
	}

	return result
}
