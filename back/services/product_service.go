package services

import (
	"back/models"
	"errors"
	"fmt"
	"gorm.io/gorm"
)

// ProductService 产品服务
type ProductService struct {
	DB *gorm.DB
}

// NewProductService 创建产品服务实例
func NewProductService(db *gorm.DB) *ProductService {
	return &ProductService{DB: db}
}

// GetProducts 获取所有产品
func (s *ProductService) GetProducts() ([]models.Product, error) {
	var products []models.Product
	result := s.DB.Find(&products)
	if result.Error != nil {
		return nil, fmt.Errorf("查询产品列表失败: %w", result.Error)
	}
	return products, nil
}

// GetProductByID 根据ID获取产品
func (s *ProductService) GetProductByID(id uint) (*models.Product, error) {
	var product models.Product
	result := s.DB.First(&product, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("产品不存在: %w", result.Error)
		}
		return nil, fmt.Errorf("查询产品失败: %w", result.Error)
	}
	return &product, nil
}

// GetProductsByCategory 根据分类获取产品
func (s *ProductService) GetProductsByCategory(category string) ([]models.Product, error) {
	var products []models.Product
	result := s.DB.Where("category = ?", category).Find(&products)
	if result.Error != nil {
		return nil, fmt.Errorf("查询产品失败: %w", result.Error)
	}
	return products, nil
}

// CreateProduct 创建产品
func (s *ProductService) CreateProduct(product *models.Product) error {
	// 创建产品
	result := s.DB.Create(product)
	if result.Error != nil {
		return fmt.Errorf("创建产品失败: %w", result.Error)
	}
	return nil
}

// UpdateProduct 更新产品
func (s *ProductService) UpdateProduct(product *models.Product) error {
	// 检查产品是否存在
	var existingProduct models.Product
	if result := s.DB.First(&existingProduct, product.ID); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("产品不存在")
		}
		return fmt.Errorf("查询产品失败: %w", result.Error)
	}

	// 更新产品信息
	result := s.DB.Model(product).Updates(map[string]interface{}{
		"name":        product.Name,
		"description": product.Description,
		"price":       product.Price,
		"stock":       product.Stock,
		"category":    product.Category,
		"image_url":   product.ImageURL,
		"status":      product.Status,
	})

	if result.Error != nil {
		return fmt.Errorf("更新产品失败: %w", result.Error)
	}
	return nil
}

// DeleteProduct 删除产品
func (s *ProductService) DeleteProduct(id uint) error {
	// 检查产品是否存在
	var product models.Product
	if result := s.DB.First(&product, id); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("产品不存在")
		}
		return fmt.Errorf("查询产品失败: %w", result.Error)
	}

	// 软删除产品
	result := s.DB.Delete(&product)
	if result.Error != nil {
		return fmt.Errorf("删除产品失败: %w", result.Error)
	}
	return nil
}

// UpdateProductStock 更新产品库存
func (s *ProductService) UpdateProductStock(id uint, quantity int) error {
	// 检查产品是否存在
	var product models.Product
	if result := s.DB.First(&product, id); result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("产品不存在")
		}
		return fmt.Errorf("查询产品失败: %w", result.Error)
	}

	// 更新库存
	newStock := product.Stock + quantity
	if newStock < 0 {
		return errors.New("库存不足")
	}

	result := s.DB.Model(&product).Update("stock", newStock)
	if result.Error != nil {
		return fmt.Errorf("更新库存失败: %w", result.Error)
	}
	return nil
}

// SearchProducts 搜索产品
func (s *ProductService) SearchProducts(keyword string) ([]models.Product, error) {
	var products []models.Product
	result := s.DB.Where("name LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&products)
	if result.Error != nil {
		return nil, fmt.Errorf("搜索产品失败: %w", result.Error)
	}
	return products, nil
}
