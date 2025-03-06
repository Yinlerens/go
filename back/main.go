package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/memstore"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/logto-io/go/v2/client"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"back/auth"
)

// 全局变量
var (
	DB *gorm.DB
)

// 初始化数据库连接
func initDB() {
	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Println("警告: 未找到.env文件，将使用默认环境变量")
	}

	// 获取数据库连接信息
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "root" // 默认用户名
	}

	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "password" // 默认密码
	}

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost" // 默认主机
	}

	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "3306" // 默认端口
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "go_service" // 默认数据库名
	}

	// 构建DSN (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	// 配置GORM日志
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second, // 慢SQL阈值
			LogLevel:                  logger.Info, // 日志级别
			IgnoreRecordNotFoundError: true,        // 忽略ErrRecordNotFound错误
			Colorful:                  true,        // 彩色打印
		},
	)

	// 连接数据库
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 获取通用数据库对象，设置连接池
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("获取数据库连接池失败: %v", err)
	}

	// 设置连接池参数
	sqlDB.SetMaxIdleConns(10)           // 设置空闲连接池中连接的最大数量
	sqlDB.SetMaxOpenConns(100)          // 设置打开数据库连接的最大数量
	sqlDB.SetConnMaxLifetime(time.Hour) // 设置连接可复用的最大时间

	DB = db
	log.Println("数据库连接成功")
}

// 初始化Logto配置
func initLogtoConfig() *client.LogtoConfig {
	logtoConfig := &client.LogtoConfig{
		Endpoint:  os.Getenv("LOGTO_ENDPOINT"),
		AppId:     os.Getenv("LOGTO_APP_ID"),
		AppSecret: os.Getenv("LOGTO_APP_SECRET"),
		Resources: []string{},
	}

	resources, present := os.LookupEnv("LOGTO_RESOURCES")
	if present {
		logtoConfig.Resources = strings.Split(resources, ",")
	}

	return logtoConfig
}

// 初始化Gin路由
func initRouter() *gin.Engine {
	// 创建默认的gin路由
	r := gin.Default()

	// 添加全局中间件
	r.Use(gin.Logger())   // 日志中间件
	r.Use(gin.Recovery()) // 恢复中间件，从任何panic恢复

	// 初始化会话存储
	store := memstore.NewStore([]byte(os.Getenv("SESSION_SECRET")))
	r.Use(sessions.Sessions("logto-session", store))

	// 健康检查路由
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "服务运行正常",
		})
	})

	// 初始化Logto配置
	logtoConfig := initLogtoConfig()

	// 创建Logto控制器
	logtoController := auth.NewLogtoController(logtoConfig)

	// 注册认证相关路由
	authGroup := r.Group("/auth")
	logtoController.Register(authGroup)

	// API版本v1
	v1 := r.Group("/api/v1")
	{
		// 用户相关路由
		user := v1.Group("/users")
		{
			user.GET("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "获取用户列表"})
			})
			user.GET("/:id", func(c *gin.Context) {
				id := c.Param("id")
				c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("获取用户ID: %s", id)})
			})
			user.POST("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "创建新用户"})
			})
			user.PUT("/:id", func(c *gin.Context) {
				id := c.Param("id")
				c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("更新用户ID: %s", id)})
			})
			user.DELETE("/:id", func(c *gin.Context) {
				id := c.Param("id")
				c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("删除用户ID: %s", id)})
			})
		}

		// 产品相关路由
		product := v1.Group("/products")
		{
			product.GET("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "获取产品列表"})
			})
			product.GET("/:id", func(c *gin.Context) {
				id := c.Param("id")
				c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("获取产品ID: %s", id)})
			})
		}
	}

	return r
}

func main() {
	// 初始化数据库连接
	initDB()

	// 初始化路由
	router := initRouter()

	// 获取服务端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 默认端口
	}

	// 启动服务
	serverAddr := fmt.Sprintf(":%s", port)
	log.Printf("服务器启动在 http://localhost%s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
