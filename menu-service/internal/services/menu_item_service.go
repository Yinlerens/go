// internal/services/menu_item_service.go
package services

import (
	"errors"
	"menu-service/internal/models"
	"menu-service/internal/repositories"
	"menu-service/internal/utils"
	"regexp"

	"github.com/google/uuid"
)

// 常量定义
const (
	MaxMenuLevel = 3 // 最大菜单层级
)

// MenuItemService 菜单项服务接口
type MenuItemService interface {
	CreateMenuItem(name, path, icon, permissionKey, parentID string, order int, isEnabled bool, meta models.JSON, actorID, actorType string) (*models.MenuItem, error)
	GetMenuTree() ([]*MenuTreeNode, error)
	GetMenuItem(id string) (*models.MenuItem, error)
	UpdateMenuItem(id, name, path, icon, permissionKey, parentID string, order int, isEnabled bool, meta models.JSON, actorID, actorType string) error
	DeleteMenuItem(id string, actorID, actorType string) error
	UpdateMenuPermission(id, permissionKey string, actorID, actorType string) error
}

// MenuTreeNode 菜单树节点
type MenuTreeNode struct {
	ID            string          `json:"id"`
	Name          string          `json:"name"`
	Path          string          `json:"path"`
	Icon          string          `json:"icon"`
	PermissionKey string          `json:"permission_key,omitempty"`
	ParentID      string          `json:"parent_id"`
	Order         int             `json:"order"`
	IsEnabled     bool            `json:"is_enabled"`
	Meta          models.JSON     `json:"meta,omitempty"`
	Children      []*MenuTreeNode `json:"children"`
}

// menuItemService 菜单项服务实现
type menuItemService struct {
	menuItemRepo repositories.MenuItemRepository
	menuLogRepo  repositories.MenuLogRepository
	rbacClient   RbacClient
	logCreator   utils.MenuLogCreator
	cache        repositories.Cache
}

// NewMenuItemService 创建菜单项服务实例
func NewMenuItemService(
	menuItemRepo repositories.MenuItemRepository,
	menuLogRepo repositories.MenuLogRepository,
	rbacClient RbacClient,
	logCreator utils.MenuLogCreator,
	cache repositories.Cache,
) MenuItemService {
	return &menuItemService{
		menuItemRepo: menuItemRepo,
		menuLogRepo:  menuLogRepo,
		rbacClient:   rbacClient,
		logCreator:   logCreator,
		cache:        cache,
	}
}

// isValidPath 验证路径是否合法
func isValidPath(path string) bool {
	// 路径以/开头，可以包含字母、数字、下划线、横杠和斜杠
	pattern := `^/[a-zA-Z0-9_\-/]*$`
	match, _ := regexp.MatchString(pattern, path)
	return match
}

// getMenuLevel 计算菜单层级
func (s *menuItemService) getMenuLevel(parentID string) (int, error) {
	if parentID == "" {
		return 1, nil
	}

	level := 1
	currentID := parentID

	for level <= MaxMenuLevel {
		parent, err := s.menuItemRepo.FindByID(currentID)
		if err != nil {
			return 0, err
		}

		level++
		if parent.ParentID == "" {
			break
		}
		currentID = parent.ParentID
	}

	return level, nil
}

// CreateMenuItem 创建菜单项
func (s *menuItemService) CreateMenuItem(name, path, icon, permissionKey, parentID string, order int, isEnabled bool, meta models.JSON, actorID, actorType string) (*models.MenuItem, error) {
	// 验证路径格式
	if !isValidPath(path) {
		return nil, errors.New("菜单路径格式无效")
	}

	// 验证父菜单存在性
	if parentID != "" {
		parent, err := s.menuItemRepo.FindByID(parentID)
		if err != nil {
			return nil, errors.New("父菜单不存在")
		}

		// 检查是否创建循环引用
		if parent.ParentID == parentID {
			return nil, errors.New("不能创建循环引用的菜单")
		}
	}

	// 验证菜单层级
	level, err := s.getMenuLevel(parentID)
	if err != nil {
		return nil, err
	}
	if level > MaxMenuLevel {
		return nil, errors.New("菜单层级超出限制")
	}

	// 检查路径唯一性
	existingItem, err := s.menuItemRepo.FindByPath(path)
	if err == nil && existingItem != nil {
		return nil, errors.New("菜单路径已存在")
	}

	// 验证权限标识存在性
	if permissionKey != "" {
		exists, err := s.rbacClient.CheckPermissionExists(permissionKey)
		if err != nil || !exists {
			return nil, errors.New("权限标识不存在于RBAC系统")
		}
	}

	// 创建菜单项
	menuItem := &models.MenuItem{
		ID:            uuid.New().String(),
		Name:          name,
		Path:          path,
		Icon:          icon,
		PermissionKey: permissionKey,
		ParentID:      parentID,
		Order:         order,
		IsEnabled:     isEnabled,
		Meta:          meta,
	}

	if err := s.menuItemRepo.Create(menuItem); err != nil {
		return nil, err
	}

	// 创建操作日志
	log := s.logCreator.CreateMenuLog(
		menuItem.ID,
		"CREATE",
		actorID,
		actorType,
		nil,
		models.JSON{
			"id":             menuItem.ID,
			"name":           menuItem.Name,
			"path":           menuItem.Path,
			"icon":           menuItem.Icon,
			"permission_key": menuItem.PermissionKey,
			"parent_id":      menuItem.ParentID,
			"order":          menuItem.Order,
			"is_enabled":     menuItem.IsEnabled,
			"meta":           menuItem.Meta,
		},
	)
	s.menuLogRepo.Create(log)

	// 清除菜单树缓存
	s.cache.Delete("menu_tree")

	return menuItem, nil
}

// buildMenuTree 构建菜单树
func (s *menuItemService) buildMenuTree(menuItems []*models.MenuItem) []*MenuTreeNode {
	// 创建ID到菜单项的映射
	menuMap := make(map[string]*MenuTreeNode)
	for _, item := range menuItems {
		menuMap[item.ID] = &MenuTreeNode{
			ID:            item.ID,
			Name:          item.Name,
			Path:          item.Path,
			Icon:          item.Icon,
			PermissionKey: item.PermissionKey,
			ParentID:      item.ParentID,
			Order:         item.Order,
			IsEnabled:     item.IsEnabled,
			Meta:          item.Meta,
			Children:      []*MenuTreeNode{},
		}
	}

	// 构建树形结构
	var rootNodes []*MenuTreeNode
	for _, item := range menuItems {
		node := menuMap[item.ID]
		if item.ParentID == "" {
			rootNodes = append(rootNodes, node)
		} else {
			parent, exists := menuMap[item.ParentID]
			if exists {
				parent.Children = append(parent.Children, node)
			}
		}
	}

	return rootNodes
}

// GetMenuTree 获取菜单树
func (s *menuItemService) GetMenuTree() ([]*MenuTreeNode, error) {
	// 尝试从缓存获取
	if cachedTree, found := s.cache.Get("menu_tree"); found {
		return cachedTree.([]*MenuTreeNode), nil
	}

	// 查询所有菜单项
	menuItems, err := s.menuItemRepo.FindAll()
	if err != nil {
		return nil, err
	}

	// 构建树形结构
	tree := s.buildMenuTree(menuItems)

	// 缓存结果
	s.cache.Set("menu_tree", tree, 0) // 不过期，依靠手动清除

	return tree, nil
}

// GetMenuItem 获取菜单项
func (s *menuItemService) GetMenuItem(id string) (*models.MenuItem, error) {
	return s.menuItemRepo.FindByID(id)
}

// UpdateMenuItem 更新菜单项
func (s *menuItemService) UpdateMenuItem(id, name, path, icon, permissionKey, parentID string, order int, isEnabled bool, meta models.JSON, actorID, actorType string) error {
	// 验证菜单项存在
	oldMenuItem, err := s.menuItemRepo.FindByID(id)
	if err != nil {
		return errors.New("菜单项不存在")
	}

	// 存储旧数据
	oldData := models.JSON{
		"id":             oldMenuItem.ID,
		"name":           oldMenuItem.Name,
		"path":           oldMenuItem.Path,
		"icon":           oldMenuItem.Icon,
		"permission_key": oldMenuItem.PermissionKey,
		"parent_id":      oldMenuItem.ParentID,
		"order":          oldMenuItem.Order,
		"is_enabled":     oldMenuItem.IsEnabled,
		"meta":           oldMenuItem.Meta,
	}

	// 验证路径格式
	if path != oldMenuItem.Path && !isValidPath(path) {
		return errors.New("菜单路径格式无效")
	}

	// 检查路径唯一性
	if path != oldMenuItem.Path {
		existingItem, err := s.menuItemRepo.FindByPath(path)
		if err == nil && existingItem != nil && existingItem.ID != id {
			return errors.New("菜单路径已存在")
		}
	}

	// 验证父菜单存在性和循环引用
	if parentID != oldMenuItem.ParentID {
		// 防止自引用
		if parentID == id {
			return errors.New("父菜单不能是自身")
		}

		// 验证父菜单存在
		if parentID != "" {
			parent, err := s.menuItemRepo.FindByID(parentID)
			if err != nil {
				return errors.New("父菜单不存在")
			}

			// 检查是否形成循环引用
			currentID := parent.ParentID
			for currentID != "" {
				if currentID == id {
					return errors.New("不能创建循环引用的菜单")
				}

				ancestor, err := s.menuItemRepo.FindByID(currentID)
				if err != nil {
					break
				}
				currentID = ancestor.ParentID
			}
		}

		// 验证菜单层级
		level, err := s.getMenuLevel(parentID)
		if err != nil {
			return err
		}
		if level > MaxMenuLevel {
			return errors.New("菜单层级超出限制")
		}
	}
	// 验证权限标识存在性
	//if permissionKey != oldMenuItem.PermissionKey && permissionKey != "" {
	//	exists, err := s.rbacClient.CheckPermissionExists(permissionKey)
	//	if err != nil || !exists {
	//		return errors.New("权限标识不存在于RBAC系统")
	//	}
	//}
	// 更新菜单项
	oldMenuItem.Name = name
	oldMenuItem.Path = path
	oldMenuItem.Icon = icon
	oldMenuItem.PermissionKey = permissionKey
	oldMenuItem.ParentID = parentID
	oldMenuItem.Order = order
	oldMenuItem.IsEnabled = isEnabled
	oldMenuItem.Meta = meta

	if err := s.menuItemRepo.Update(oldMenuItem); err != nil {
		return err
	}

	// 创建操作日志
	newData := models.JSON{
		"id":             oldMenuItem.ID,
		"name":           oldMenuItem.Name,
		"path":           oldMenuItem.Path,
		"icon":           oldMenuItem.Icon,
		"permission_key": oldMenuItem.PermissionKey,
		"parent_id":      oldMenuItem.ParentID,
		"order":          oldMenuItem.Order,
		"is_enabled":     oldMenuItem.IsEnabled,
		"meta":           oldMenuItem.Meta,
	}

	log := s.logCreator.CreateMenuLog(
		oldMenuItem.ID,
		"UPDATE",
		actorID,
		actorType,
		oldData,
		newData,
	)
	s.menuLogRepo.Create(log)

	// 清除菜单树缓存
	s.cache.Delete("menu_tree")

	return nil
}

// DeleteMenuItem 删除菜单项
func (s *menuItemService) DeleteMenuItem(id string, actorID, actorType string) error {
	// 验证菜单项存在
	menuItem, err := s.menuItemRepo.FindByID(id)
	if err != nil {
		return errors.New("菜单项不存在")
	}

	// 存储旧数据
	oldData := models.JSON{
		"id":             menuItem.ID,
		"name":           menuItem.Name,
		"path":           menuItem.Path,
		"icon":           menuItem.Icon,
		"permission_key": menuItem.PermissionKey,
		"parent_id":      menuItem.ParentID,
		"order":          menuItem.Order,
		"is_enabled":     menuItem.IsEnabled,
		"meta":           menuItem.Meta,
	}

	// 检查是否有子菜单
	childCount, err := s.menuItemRepo.CountChildren(id)
	if err != nil {
		return err
	}
	if childCount > 0 {
		return errors.New("存在子菜单，无法删除")
	}

	// 删除菜单项
	if err := s.menuItemRepo.Delete(id); err != nil {
		return err
	}

	// 创建操作日志
	log := s.logCreator.CreateMenuLog(
		menuItem.ID,
		"DELETE",
		actorID,
		actorType,
		oldData,
		nil,
	)
	s.menuLogRepo.Create(log)

	// 清除菜单树缓存
	s.cache.Delete("menu_tree")

	return nil
}

// UpdateMenuPermission 更新菜单权限
func (s *menuItemService) UpdateMenuPermission(id, permissionKey string, actorID, actorType string) error {
	// 验证菜单项存在
	menuItem, err := s.menuItemRepo.FindByID(id)
	if err != nil {
		return errors.New("菜单项不存在")
	}

	// 存储旧数据
	oldData := models.JSON{
		"id":             menuItem.ID,
		"permission_key": menuItem.PermissionKey,
	}

	// 验证权限标识存在性
	if permissionKey != "" {
		exists, err := s.rbacClient.CheckPermissionExists(permissionKey)
		if err != nil || !exists {
			return errors.New("权限标识不存在于RBAC系统")
		}
	}

	// 更新菜单项权限
	menuItem.PermissionKey = permissionKey

	if err := s.menuItemRepo.Update(menuItem); err != nil {
		return err
	}

	// 创建操作日志
	newData := models.JSON{
		"id":             menuItem.ID,
		"permission_key": menuItem.PermissionKey,
	}

	log := s.logCreator.CreateMenuLog(
		menuItem.ID,
		"UPDATE_PERMISSION",
		actorID,
		actorType,
		oldData,
		newData,
	)
	s.menuLogRepo.Create(log)

	// 清除菜单树缓存
	s.cache.Delete("menu_tree")

	return nil
}
