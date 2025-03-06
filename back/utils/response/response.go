package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`    // 状态码
	Message string      `json:"message"` // 消息
	Data    interface{} `json:"data"`    // 数据
	Error   string      `json:"error"`   // 错误信息，当且仅当code不为200时存在
}

// Success 成功响应
func Success(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
		Message: message,
		Data:    data,
		Error:   "",
	})
}

// Fail 失败响应
func Fail(c *gin.Context, code int, message string, err string) {
	// 如果未指定错误码，则使用服务器内部错误码
	if code == 0 {
		code = http.StatusInternalServerError
	}

	c.JSON(code, Response{
		Code:    code,
		Message: message,
		Data:    nil,
		Error:   err,
	})
}

// BadRequest 请求参数错误响应
func BadRequest(c *gin.Context, message string, err string) {
	Fail(c, http.StatusBadRequest, message, err)
}

// Unauthorized 未授权响应
func Unauthorized(c *gin.Context, message string, err string) {
	Fail(c, http.StatusUnauthorized, message, err)
}

// Forbidden 禁止访问响应
func Forbidden(c *gin.Context, message string, err string) {
	Fail(c, http.StatusForbidden, message, err)
}

// NotFound 资源不存在响应
func NotFound(c *gin.Context, message string, err string) {
	Fail(c, http.StatusNotFound, message, err)
}

// ServerError 服务器内部错误响应
func ServerError(c *gin.Context, message string, err string) {
	Fail(c, http.StatusInternalServerError, message, err)
}
