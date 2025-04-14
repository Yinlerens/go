// internal/api/middlewares/audit_logger.go
package middlewares

import (
	"github.com/gin-gonic/gin"
	"rbac-service/internal/models"
	"rbac-service/internal/repositories"
	"rbac-service/internal/utils"
)

// AuditLogger 创建工厂函数，返回审计日志中间件
func AuditLogger(auditRepo repositories.AuditLogRepository, auditCreator utils.AuditLogCreator) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 前置处理
		c.Next()

		// 检查是否有审计信息
		action, ok := c.Get("audit_action")
		if !ok {
			return // 没有设置审计动作，不记录日志
		}

		// 获取操作结果
		status := "SUCCESS"
		errorMsg := ""
		if len(c.Errors) > 0 || c.GetInt("response_code") != 0 {
			status = "FAILURE"
			if len(c.Errors) > 0 {
				errorMsg = c.Errors.String()
			} else {
				errorMsg = c.GetString("error_message")
			}
		}

		// 从上下文获取基本信息
		actorID := c.GetString("caller_id")
		if actorID == "" {
			actorID = "system"
		}

		actorType := c.GetString("caller_type")
		if actorType == "" {
			actorType = "SERVICE"
		}

		// 获取用户信息
		userID := c.GetString("user_id")
		username := c.GetString("username")
		userIP := c.ClientIP()

		// 获取目标信息
		targetType, _ := c.Get("audit_target_type")
		targetKey, _ := c.Get("audit_target_key")
		details, _ := c.Get("audit_details")

		// 确保所有字段都有默认值
		targetTypeStr := ""
		if targetType != nil {
			targetTypeStr = targetType.(string)
		}

		targetKeyStr := ""
		if targetKey != nil {
			targetKeyStr = targetKey.(string)
		}

		var detailsJSON models.JSON
		if details != nil {
			detailsJSON = details.(models.JSON)
		} else {
			detailsJSON = models.JSON{}
		}

		// 创建并保存审计日志
		auditLog := auditCreator.CreateAuditLog(
			actorID,
			actorType,
			action.(string),
			targetTypeStr,
			targetKeyStr,
			detailsJSON,
			status,
			errorMsg,
			userID,
			username,
			userIP,
		)

		auditRepo.Create(auditLog)
	}
}