package controllers

import (
	"net/http"
	"strconv"

	"back/models"
	"back/services"
	"back/utils/response"
	"github.com/gin-gonic/gin"
)

// ProductController 产品控制器
type ProductController struct {
	productService *services.ProductService
}

// NewProductController 创建产品控制器实例
func NewProductController(productService *services.ProductService) *ProductController {
	return &ProductController{productService: productService}
}

// Register 注册产品控制器路由
func (c *ProductController) Register(router *gin.RouterGroup) {
	productRouter := router.Group("/products")
	{
		productRouter.GET("/", c.GetProducts)         // 获取产品列表
		productRouter.GET("/:id", c.GetProduct)       // 获取单个产品
		productRouter.POST("/", c.CreateProduct)      // 创建产品
		productRouter.PUT("/:id", c.UpdateProduct)    // 更新产品
		productRouter.DELETE("/:id", c.DeleteProduct) // 删除产品
	}
}

// GetProducts 获取产品列表
// @Summary 获取产品列表
// @Description 获取所有产品的列表
// @Tags 产品管理
// @Accept json
// @Produce json
// @Success 200 {object} response.Response{data=[]models.Product}
// @Router /api/v1/products [get]
func (c *ProductController) GetProducts(ctx *gin.Context) {
	products, err := c.productService.GetProducts()
	if err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "获取产品列表失败", err.Error())
		return
	}
	response.Success(ctx, "获取产品列表成功", products)
}

// GetProduct 获取单个产品
// @Summary 获取单个产品
// @Description 根据ID获取产品信息
// @Tags 产品管理
// @Accept json
// @Produce json
// @Param id path int true "产品ID"
// @Success 200 {object} response.Response{data=models.Product}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/products/{id} [get]
func (c *ProductController) GetProduct(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的产品ID", err.Error())
		return
	}

	product, err := c.productService.GetProductByID(uint(id))
	if err != nil {
		response.Fail(ctx, http.StatusNotFound, "产品不存在", err.Error())
		return
	}

	response.Success(ctx, "获取产品成功", product)
}

// CreateProduct 创建产品
// @Summary 创建新产品
// @Description 创建一个新的产品
// @Tags 产品管理
// @Accept json
// @Produce json
// @Param product body models.Product true "产品信息"
// @Success 201 {object} response.Response{data=models.Product}
// @Failure 400 {object} response.Response
// @Router /api/v1/products [post]
func (c *ProductController) CreateProduct(ctx *gin.Context) {
	var product models.Product
	if err := ctx.ShouldBindJSON(&product); err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的请求数据", err.Error())
		return
	}

	if err := c.productService.CreateProduct(&product); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "创建产品失败", err.Error())
		return
	}

	response.Success(ctx, "创建产品成功", product)
}

// UpdateProduct 更新产品
// @Summary 更新产品
// @Description 根据ID更新产品信息
// @Tags 产品管理
// @Accept json
// @Produce json
// @Param id path int true "产品ID"
// @Param product body models.Product true "产品信息"
// @Success 200 {object} response.Response{data=models.Product}
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/products/{id} [put]
func (c *ProductController) UpdateProduct(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的产品ID", err.Error())
		return
	}

	var product models.Product
	if err := ctx.ShouldBindJSON(&product); err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的请求数据", err.Error())
		return
	}

	product.ID = uint(id)
	if err := c.productService.UpdateProduct(&product); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "更新产品失败", err.Error())
		return
	}

	response.Success(ctx, "更新产品成功", product)
}

// DeleteProduct 删除产品
// @Summary 删除产品
// @Description 根据ID删除产品
// @Tags 产品管理
// @Accept json
// @Produce json
// @Param id path int true "产品ID"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Failure 404 {object} response.Response
// @Router /api/v1/products/{id} [delete]
func (c *ProductController) DeleteProduct(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		response.Fail(ctx, http.StatusBadRequest, "无效的产品ID", err.Error())
		return
	}

	if err := c.productService.DeleteProduct(uint(id)); err != nil {
		response.Fail(ctx, http.StatusInternalServerError, "删除产品失败", err.Error())
		return
	}

	response.Success(ctx, "删除产品成功", nil)
}
