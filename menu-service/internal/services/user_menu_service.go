// internal/services/user_menu_service.go
package services

import (
	"menu-service/internal/models"
	"menu-service/internal/repositories"
	"menu-service/internal/utils"
	"sort"
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
	// 获取用户权限列表
	userPermissions, err := s.rbacClient.GetUserPermissions(userID)
	utils.Error("GetUserPermissions: ", err.Error())
	if err != nil {
		return nil, err
	}

	// 获取所有菜单项
	allMenuItems, err := s.menuItemRepo.FindAll()
	if err != nil {
		utils.Error("获取菜单项失败", err.Error())
		return nil, err
	}

	// 创建权限映射表
	permissionMap := make(map[string]bool)
	for _, perm := range userPermissions {
		permissionMap[perm] = true
	}

	// 创建菜单ID映射表
	menuMap := make(map[string]*models.MenuItem)
	for _, item := range allMenuItems {
		if item.IsEnabled {
			menuMap[item.ID] = item
		}
	}

	// 有权访问的菜单ID集合
	authorizedMenuIDs := make(map[string]bool)

	// 第一步：找出用户直接拥有权限的菜单项
	for _, item := range menuMap {
		// 如果菜单没有设置权限，或者用户拥有该权限
		hasPermission := item.PermissionKey == "" || permissionMap[item.PermissionKey]
		if hasPermission {
			authorizedMenuIDs[item.ID] = true
			// 对于有权限的菜单，其所有父菜单也应该显示（不管父菜单是否有权限）
			parentID := item.ParentID
			for parentID != "" {
				parent, exists := menuMap[parentID]
				if !exists {
					utils.Error("父菜单不存在", parentID)
					break
				}
				authorizedMenuIDs[parentID] = true
				parentID = parent.ParentID
			}
		} else {
			utils.Error("用户无权限访问菜单", "")
		}
	}
	// 跟踪哪些菜单具有真实权限，而不是因为其子菜单具有权限
	realPermissionMenus := make(map[string]bool)
	for id := range authorizedMenuIDs {
		item := menuMap[id]
		if item.PermissionKey != "" && permissionMap[item.PermissionKey] {
			realPermissionMenus[id] = true
		} else if item.PermissionKey == "" {
			realPermissionMenus[id] = true
		}
	}
	// 多次遍历直到没有新的菜单被添加
	iteration := 1
	changed := true
	for changed {
		changed = false
		newlyAdded := make([]string, 0)

		for id := range realPermissionMenus {
			// 查找并添加所有子菜单
			for childID, childItem := range menuMap {
				if childItem.ParentID == id && !authorizedMenuIDs[childID] {
					authorizedMenuIDs[childID] = true
					realPermissionMenus[childID] = true // 子菜单也有真实权限
					newlyAdded = append(newlyAdded, childID)
					changed = true
				}
			}
		}

		iteration++
	}

	// 过滤有权限的菜单项
	var filteredItems []*models.MenuItem
	for id := range authorizedMenuIDs {
		if item, exists := menuMap[id]; exists {
			filteredItems = append(filteredItems, item)
		}
	}
	// 构建用户菜单树
	userMenuTree := s.buildUserMenuTree(filteredItems)

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

	// 用于存储根节点的切片
	var rootNodes []*UserMenuNode

	// 先构建所有父子关系
	for _, item := range menuItems {
		node := menuMap[item.ID]
		if item.ParentID == "" {
			rootNodes = append(rootNodes, node)
		} else {
			parent, exists := menuMap[item.ParentID]
			if exists {
				parent.Children = append(parent.Children, node)
			} else {
				rootNodes = append(rootNodes, node)
			}
		}
	}

	// 对所有节点的子节点进行排序
	for _, node := range menuMap {
		if len(node.Children) > 0 {
			sort.Slice(node.Children, func(i, j int) bool {
				return node.Children[i].Order < node.Children[j].Order
			})
		}
	}

	// 对根节点进行排序
	sort.Slice(rootNodes, func(i, j int) bool {
		return rootNodes[i].Order < rootNodes[j].Order
	})

	return rootNodes
}