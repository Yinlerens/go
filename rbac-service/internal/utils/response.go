// internal/utils/response.go
package utils

import "github.com/gin-gonic/gin"

// 统一响应码定义
const (
	CodeSuccess            = 0    // 成功
	CodeInvalidParams      = 1001 // 请求参数无效/格式错误
	CodeNoPermission       = 2001 // 权限不足
	CodeRoleExists         = 2002 // 角色已存在
	CodeRoleNotFound       = 2003 // 角色不存在
	CodePermissionExists   = 2004 // 权限标识已存在
	CodePermissionNotFound = 2005 // 权限标识不存在
	CodeUserInvalid        = 2006 // 用户不存在或无效
	CodeUserRoleExists     = 2007 // 用户已拥有该角色
	CodeRolePermExists     = 2008 // 角色已拥有该权限
	CodeUserRoleNotExists  = 2009 // 用户未拥有该角色
	CodeRolePermNotExists  = 2010 // 角色未拥有该权限
	CodeNoAuditAccess      = 2011 // 查询审计日志权限不足
	CodeAPIKeyInvalid      = 1009 // 无权调用此接口
	CodeInternalError      = 9999 // 服务器内部错误
)

// 响应消息定义
var codeMessages = map[int]string{
	CodeSuccess:            "成功",
	CodeInvalidParams:      "请求参数无效或格式错误",
	CodeNoPermission:       "权限不足",
	CodeRoleExists:         "角色已存在",
	CodeRoleNotFound:       "角色不存在",
	CodePermissionExists:   "权限标识已存在",
	CodePermissionNotFound: "权限标识不存在",
	CodeUserInvalid:        "用户不存在或无效",
	CodeUserRoleExists:     "用户已拥有该角色",
	CodeRolePermExists:     "角色已拥有该权限",
	CodeUserRoleNotExists:  "用户未拥有该角色",
	CodeRolePermNotExists:  "角色未拥有该权限",
	CodeNoAuditAccess:      "查询审计日志权限不足",
	CodeAPIKeyInvalid:      "无权调用此接口",
	CodeInternalError:      "服务器内部错误，请稍后重试",
}

// Response 统一响应结构
type Response struct {
	Code int         `json:"code"` // 业务状态码
	Msg  string      `json:"msg"`  // 状态说明
	Data interface{} `json:"data"` // 数据内容
}

// NewResponse 创建新的响应
func NewResponse(code int, data interface{}) Response {
	msg, exists := codeMessages[code]
	if !exists {
		msg = "未知错误"
	}
	return Response{
		Code: code,
		Msg:  msg,
		Data: data,
	}
}

// NewResponseWithContext 创建新的响应并设置上下文信息
func NewResponseWithContext(c *gin.Context, code int, data interface{}) Response {
	// 设置响应代码到上下文，供审计中间件使用
	c.Set("response_code", code)

	// 如果是错误，记录错误信息
	if code != CodeSuccess {
		msg, exists := codeMessages[code]
		if !exists {
			msg = "未知错误"
		}
		c.Set("error_message", msg)
	}

	return NewResponse(code, data)
}