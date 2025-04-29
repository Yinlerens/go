// internal/config/config.go
package config

import (
	"errors"
	"fmt"
	"github.com/joho/godotenv" // 导入库
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log"
	"os"
	"time"
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

	// 认证服务配置
	AuthServiceURL string

	// API Key配置
	InternalAPIKeys map[string]string
}

// LoadConfig 从环境变量加载配置
func LoadConfig() (*Config, error) {
	err := godotenv.Load() // 默认查找当前目录或父目录的 .env
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Println("信息: .env 文件未找到, 将完全依赖实际环境变量 (部署环境预期行为)")
		} else {
			log.Printf("警告: 加载 .env 文件时遇到非预期的错误: %v", err)
		}
	} else {
		log.Println("信息: 已成功加载 .env 文件中的环境变量 (本地环境)")
	}
	// 从环境变量读取配置
	config := &Config{
		ServerPort:     getEnv("RBAC_SERVER_PORT"),
		Environment:    getEnv("ENVIRONMENT"),
		DBHost:         getEnv("DB_HOST"),
		DBPort:         getEnv("DB_PORT"),
		DBUser:         getEnv("DB_USER"),
		DBPassword:     getEnv("DB_PASSWORD"),
		DBName:         getEnv("DB_NAME"),
		AuthServiceURL: getEnv("AUTH_SERVICE_URL"),
	}

	config.CacheExpiry = time.Duration(5) * time.Minute

	// 初始化内部API密钥
	config.InternalAPIKeys = make(map[string]string)
	internalAPIKey := getEnv("INTERNAL_API_KEY")
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
func getEnv(key string) string {
	value := os.Getenv(key)
	return value
}