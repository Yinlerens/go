// internal/config/config.go
package config

import (
	"fmt"
	"os"
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

	// JWT配置
	JWTSecret          string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration

	// Cookie配置
	CookieDomain string
	SecureCookie bool

	// API Key配置
	InternalAPIKeys map[string]string
}

// LoadConfig 从环境变量加载配置
func LoadConfig() (*Config, error) {
	// 优先从.env文件加载环境变量
	if err := godotenv.Load(); err != nil {
		// 如果.env文件不存在，只记录日志，不返回错误
		fmt.Println("警告: .env文件不存在或无法加载，将使用系统环境变量")
	}

	// 从环境变量读取配置
	config := &Config{
		ServerPort:   getEnv("SERVER_PORT", "8080"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		DBHost:       getEnv("DB_HOST", "gz-cdb-r1mv7m75.sql.tencentcdb.com"),
		DBPort:       getEnv("DB_PORT", "22197"),
		DBUser:       getEnv("DB_USER", "root"),
		DBPassword:   getEnv("DB_PASSWORD", "kid@1412"),
		DBName:       getEnv("DB_NAME", "auth_service"),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		CookieDomain: getEnv("COOKIE_DOMAIN", ".yourdomain.com"),
		SecureCookie: getEnv("SECURE_COOKIE", "true") == "true",
	}

	// 设置令牌过期时间
	accessExpiryMinutes := getEnv("ACCESS_TOKEN_EXPIRY_MINUTES", "15")
	refreshExpiryDays := getEnv("REFRESH_TOKEN_EXPIRY_DAYS", "7")

	// 尝试将字符串转换为整数，如果失败则使用默认值
	var accessMinutes, refreshDays int
	if _, err := fmt.Sscanf(accessExpiryMinutes, "%d", &accessMinutes); err != nil {
		accessMinutes = 15
	}
	if _, err := fmt.Sscanf(refreshExpiryDays, "%d", &refreshDays); err != nil {
		refreshDays = 7
	}

	config.AccessTokenExpiry = time.Duration(accessMinutes) * time.Minute
	config.RefreshTokenExpiry = time.Duration(refreshDays) * 24 * time.Hour

	// 验证JWT密钥
	if config.JWTSecret == "" {
		return nil, fmt.Errorf("JWT密钥未设置，请在.env文件中设置JWT_SECRET")
	}

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
