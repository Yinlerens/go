package models

import (
	"time"

	"gorm.io/gorm"
)

// Product 产品模型
type Product struct {
	ID          uint           `json:"id" gorm:"primaryKey"`            // 产品ID，主键
	CreatedAt   time.Time      `json:"created_at"`                      // 创建时间
	UpdatedAt   time.Time      `json:"updated_at"`                      // 更新时间
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`                  // 软删除时间
	Name        string         `json:"name" gorm:"size:100;not null"`   // 产品名称
	Description string         `json:"description" gorm:"size:500"`     // 产品描述
	Price       float64        `json:"price" gorm:"type:decimal(10,2)"` // 产品价格
	Stock       int            `json:"stock" gorm:"default:0"`          // 库存数量
	Category    string         `json:"category" gorm:"size:50"`         // 产品分类
	ImageURL    string         `json:"image_url" gorm:"size:255"`       // 产品图片URL
	Status      int            `json:"status" gorm:"default:1"`         // 状态：1上架，0下架
}

// TableName 指定表名
func (Product) TableName() string {
	return "products"
}

// BeforeCreate 创建前的钩子函数
func (p *Product) BeforeCreate(tx *gorm.DB) (err error) {
	// 这里可以添加创建前的逻辑，例如生成SKU等
	return nil
}

// IsAvailable 检查产品是否可用（有库存且已上架）
func (p *Product) IsAvailable() bool {
	return p.Status == 1 && p.Stock > 0
}
