// internal/utils/response.go
package utils

// 统一响应码定义
const (
	CodeSuccess             = 0    // 成功
	CodeInvalidParams       = 1001 // 请求参数无效/格式错误
	CodeMenuItemExists      = 3001 // 菜单项已存在
	CodeMenuItemNotFound    = 3002 // 菜单项不存在
	CodeParentMenuNotFound  = 3003 // 父菜单不存在
	CodePermissionNotFound  = 3004 // 权限标识不存在
	CodeHasChildrenMenu     = 3005 // 存在子菜单，无法删除
	CodeMenuLevelExceeded   = 3006 // 菜单层级超出限制
	CodeOrderConflict       = 3007 // 排序冲突
	CodeAPIKeyInvalid       = 1009 // 无权调用此接口
	CodeInternalServerError = 9999 // 服务器内部错误
)

// 响应消息定义
var codeMessages = map[int]string{
	CodeSuccess:             "成功",
	CodeInvalidParams:       "请求参数无效或格式错误",
	CodeMenuItemExists:      "菜单项已存在",
	CodeMenuItemNotFound:    "菜单项不存在",
	CodeParentMenuNotFound:  "父菜单不存在",
	CodePermissionNotFound:  "权限标识不存在",
	CodeHasChildrenMenu:     "存在子菜单，无法删除",
	CodeMenuLevelExceeded:   "菜单层级超出限制",
	CodeOrderConflict:       "排序冲突",
	CodeAPIKeyInvalid:       "无权调用此接口",
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