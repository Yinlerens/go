package middlewares

import (
	"bytes"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"io"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"rbac-service/internal/utils"
	"strings"
)

// 用于自定义审计逻辑的钩子
type AuditHooks struct {
	ActionResolver     func(c *gin.Context) string
	TargetTypeResolver func(c *gin.Context) string
	TargetKeyResolver  func(c *gin.Context) string
	DetailsBuilder     func(c *gin.Context) models.JSON
}

// EnhancedAuditLogger 提供自动审计功能的中间件
func EnhancedAuditLogger(auditRepo repositories.AuditLogRepository, auditCreator utils.AuditLogCreator) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 读取并保存请求体的副本
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			// 恢复请求体以便后续处理
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 保存路径信息用于后续分析
		path := c.FullPath()
		method := c.Request.Method

		// 处理请求
		c.Next()

		// 自动推断操作类型
		action := inferActionFromPath(path)

		// 自动推断目标类型和键
		targetType, targetKey := inferTargetInfo(path, requestBody)

		// 确定操作状态
		status := "SUCCESS"
		errorMsg := ""
		if len(c.Errors) > 0 || c.Writer.Status() >= 400 {
			status = "FAILURE"
			if len(c.Errors) > 0 {
				errorMsg = c.Errors.String()
			}
		}

		// 生成详情
		details := buildAuditDetails(requestBody, path, method)

		// 获取用户和调用者信息
		actorID := c.GetString("caller_id")
		if actorID == "" {
			actorID = "system"
		}

		actorType := c.GetString("caller_type")
		if actorType == "" {
			actorType = "SERVICE"
		}

		userID := c.GetString("user_id")
		username := c.GetString("username")
		userIP := c.ClientIP()

		// 创建并保存审计日志
		auditRepo.Create(auditCreator.CreateAuditLog(
			actorID, actorType, action, targetType, targetKey,
			details, status, errorMsg, userID, username, userIP,
		))
	}
}

// 根据路径推断操作类型
func inferActionFromPath(path string) string {
	// 从路径中提取动作
	segments := strings.Split(path, "/")
	if len(segments) < 2 {
		return "UNKNOWN"
	}

	// 获取最后一个路径段作为操作
	lastSegment := segments[len(segments)-1]

	// 获取倒数第二个路径段作为资源类型
	resourceType := "UNKNOWN"
	if len(segments) >= 3 {
		resourceType = strings.ToUpper(segments[len(segments)-2])
	}

	// 组合成ACTION_TYPE格式
	return resourceType + "_" + strings.ToUpper(lastSegment)
}

// 从路径和请求体中推断目标信息
func inferTargetInfo(path string, requestBody []byte) (string, string) {
	// 从路径推断目标类型
	segments := strings.Split(path, "/")
	targetType := "UNKNOWN"
	if len(segments) >= 3 {
		targetType = strings.ToUpper(segments[len(segments)-2])
	}

	// 从请求体中提取目标键
	targetKey := "ALL"
	if len(requestBody) > 0 {
		var reqData map[string]interface{}
		if err := json.Unmarshal(requestBody, &reqData); err == nil {
			// 尝试常见的键名模式
			for _, keyName := range []string{"id", "key", "role_key", "permission_key", "user_id"} {
				if val, ok := reqData[keyName].(string); ok && val != "" {
					targetKey = val
					break
				}
			}
		}
	}

	return targetType, targetKey
}

// 构建审计详情
func buildAuditDetails(requestBody []byte, path string, method string) models.JSON {
	details := models.JSON{
		"path":   path,
		"method": method,
	}

	// 添加请求体信息（排除敏感字段）
	if len(requestBody) > 0 {
		var reqData map[string]interface{}
		if err := json.Unmarshal(requestBody, &reqData); err == nil {
			// 删除敏感信息
			delete(reqData, "password")
			details["request"] = reqData
		}
	}

	return details
}