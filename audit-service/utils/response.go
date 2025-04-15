package utils

// 统一响应码定义
const (
	CodeSuccess             = 0    // 成功
	CodeInvalidParams       = 1001 // 请求参数无效/格式错误
	CodeTokenMissing        = 1002 // 认证凭证缺失
	CodeTokenInvalid        = 1003 // 认证凭证无效或过期
	CodeNoPermission        = 1004 // 无权限操作
	CodeInternalServerError = 9999 // 服务器内部错误
)

// 响应消息定义
var codeMessages = map[int]string{
	CodeSuccess:             "成功",
	CodeInvalidParams:       "请求参数无效或格式错误",
	CodeTokenMissing:        "缺少认证凭证",
	CodeTokenInvalid:        "访问凭证无效或已过期",
	CodeNoPermission:        "无权执行此操作",
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
