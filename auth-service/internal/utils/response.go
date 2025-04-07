// Package utils internal/utils/response.go
package utils

// 统一响应码定义
const (
	CodeSuccess             = 0    // 成功
	CodeInvalidParams       = 1001 // 请求参数无效/格式错误
	CodeUsernameExists      = 1002 // 用户名已存在
	CodePasswordInvalid     = 1003 // 密码不符合要求
	CodeInvalidCredentials  = 1004 // 用户名或密码错误
	CodeUserNotFound        = 1005 // 用户不存在
	CodeUserInactive        = 1006 // 用户状态非Active
	CodeTokenInvalid        = 1007 // 认证凭证无效或过期
	CodeTokenMissing        = 1008 // 认证凭证缺失
	CodeNoPermission        = 1009 // 无权限操作
	CodeResourceNotFound    = 1010 // 目标资源不存在
	CodeInternalServerError = 9999 // 服务器内部错误
)

// 响应消息定义
var codeMessages = map[int]string{
	CodeSuccess:             "成功",
	CodeInvalidParams:       "请求参数无效或格式错误",
	CodeUsernameExists:      "用户名已被注册",
	CodePasswordInvalid:     "密码长度至少需要6位",
	CodeInvalidCredentials:  "用户名或密码错误",
	CodeUserNotFound:        "用户不存在",
	CodeUserInactive:        "账户已被禁用",
	CodeTokenInvalid:        "访问凭证无效或已过期",
	CodeTokenMissing:        "缺少认证凭证",
	CodeNoPermission:        "无权执行此操作",
	CodeResourceNotFound:    "目标资源不存在",
	CodeInternalServerError: "服务器内部错误，请稍后重试",
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
