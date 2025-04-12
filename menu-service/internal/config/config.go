// internal/config/config.go
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Config 应用配置结构
type Config struct {
	// 服务器配置
	ServerPort  string
	Environment string

	// 数据库配置
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// 缓存配置
	CacheExpiry time.Duration

	// 外部服务配置
	AuthServiceURL string
	RbacServiceURL string

	// API Key配置
	InternalAPIKeys map[string]string
}

// LoadConfig 从环境变量加载配置
func LoadConfig() (*Config, error) {
	// 优先从.env文件加载环境变量
	if err := godotenv.Load(); err != nil {
		fmt.Println("警告: .env文件不存在或无法加载，将使用系统环境变量")
	}

	// 从环境变量读取配置
	config := &Config{
		ServerPort:     getEnv("SERVER_PORT", "8082"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "3306"),
		DBUser:         getEnv("DB_USER", "root"),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBName:         getEnv("DB_NAME", "menu_service"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL", "http://localhost:8080"),
		RbacServiceURL: getEnv("RBAC_SERVICE_URL", "http://localhost:8081"),
	}

	// 设置缓存过期时间
	cacheMinutes := getEnv("CACHE_EXPIRY_MINUTES", "5")
	minutes, err := strconv.Atoi(cacheMinutes)
	if err != nil {
		minutes = 5
	}
	config.CacheExpiry = time.Duration(minutes)

	// 初始化内部API密钥
	config.InternalAPIKeys = make(map[string]string)
	internalAPIKey := getEnv("INTERNAL_API_KEY", "")
	if internalAPIKey == "" {
		return nil, fmt.Errorf("内部API密钥未设置，请在.env文件中设置INTERNAL_API_KEY")
	}
	config.InternalAPIKeys["default"] = internalAPIKey

	return config, nil
}

// InitDB 初始化数据库连接
func InitDB(cfg *Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}