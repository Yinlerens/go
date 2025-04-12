// internal/repositories/menu_item_repo.go
package repositories

import (
	"gorm.io/gorm"
	"menu-service/internal/models"
)

// MenuItemRepository 菜单项数据访问接口
type MenuItemRepository interface {
	Create(menuItem *models.MenuItem) error
	FindByID(id string) (*models.MenuItem, error)
	FindByPath(path string) (*models.MenuItem, error)
	FindAll() ([]*models.MenuItem, error)
	FindByParentID(parentID string) ([]*models.MenuItem, error)
	FindChildren(parentID string) ([]*models.MenuItem, error)
	Update(menuItem *models.MenuItem) error
	Delete(id string) error
	CountChildren(parentID string) (int64, error)
}

// menuItemRepository 菜单项数据访问实现
type menuItemRepository struct {
	db *gorm.DB
}

// NewMenuItemRepository 创建菜单项仓库实例
func NewMenuItemRepository(db *gorm.DB) MenuItemRepository {
	return &menuItemRepository{db}
}

// Create 创建菜单项
func (r *menuItemRepository) Create(menuItem *models.MenuItem) error {
	return r.db.Create(menuItem).Error
}

// FindByID 根据ID查找菜单项
func (r *menuItemRepository) FindByID(id string) (*models.MenuItem, error) {
	var menuItem models.MenuItem
	err := r.db.Where("id = ?", id).First(&menuItem).Error
	if err != nil {
		return nil, err
	}
	return &menuItem, nil
}

// FindByPath 根据路径查找菜单项
func (r *menuItemRepository) FindByPath(path string) (*models.MenuItem, error) {
	var menuItem models.MenuItem
	err := r.db.Where("path = ?", path).First(&menuItem).Error
	if err != nil {
		return nil, err
	}
	return &menuItem, nil
}

// FindAll 获取所有菜单项
func (r *menuItemRepository) FindAll() ([]*models.MenuItem, error) {
	var menuItems []*models.MenuItem
	err := r.db.Order("`order` asc").Find(&menuItems).Error
	if err != nil {
		return nil, err
	}
	return menuItems, nil
}

// FindByParentID 根据父ID查找菜单项
func (r *menuItemRepository) FindByParentID(parentID string) ([]*models.MenuItem, error) {
	var menuItems []*models.MenuItem
	query := r.db

	if parentID == "" {
		query = query.Where("parent_id IS NULL OR parent_id = ''")
	} else {
		query = query.Where("parent_id = ?", parentID)
	}

	err := query.Order("`order` asc").Find(&menuItems).Error
	if err != nil {
		return nil, err
	}
	return menuItems, nil
}

// FindChildren 查找所有子菜单项（递归）
func (r *menuItemRepository) FindChildren(parentID string) ([]*models.MenuItem, error) {
	var menuItems []*models.MenuItem
	err := r.db.Where("parent_id = ?", parentID).Order("`order` asc").Find(&menuItems).Error
	if err != nil {
		return nil, err
	}
	return menuItems, nil
}

// Update 更新菜单项
func (r *menuItemRepository) Update(menuItem *models.MenuItem) error {
	return r.db.Save(menuItem).Error
}

// Delete 删除菜单项
func (r *menuItemRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.MenuItem{}).Error
}

// CountChildren 统计子菜单数量
func (r *menuItemRepository) CountChildren(parentID string) (int64, error) {
	var count int64
	err := r.db.Model(&models.MenuItem{}).Where("parent_id = ?", parentID).Count(&count).Error
	return count, err
}