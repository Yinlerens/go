package auth

import (
	"net/http"
	"os"

	"back/utils/response"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/logto-io/go/v2/client"
)

// LogtoController 处理Logto认证相关的请求
type LogtoController struct {
	logtoConfig *client.LogtoConfig
}

// NewLogtoController 创建一个新的Logto控制器
func NewLogtoController(logtoConfig *client.LogtoConfig) *LogtoController {
	return &LogtoController{logtoConfig: logtoConfig}
}

// Register 注册Logto认证相关的路由
func (c *LogtoController) Register(router *gin.RouterGroup) {
	router.GET("/sign-in", c.SignIn)
	router.GET("/sign-in-callback", c.SignInCallback)
	router.GET("/sign-out", c.SignOut)
	router.GET("/user-info", c.GetUserInfo)
	router.GET("/user-id-token-claims", c.GetIdTokenClaims)
}

// SignIn 处理登录请求
func (c *LogtoController) SignIn(ctx *gin.Context) {
	session := sessions.Default(ctx)
	logtoClient := client.NewLogtoClient(c.logtoConfig, NewSessionStorage(session))

	signInUri, err := logtoClient.SignInWithRedirectUri(os.Getenv("REDIRECT_URI"))
	if err != nil {
		response.ServerError(ctx, "登录失败", err.Error())
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, signInUri)
}

// SignInCallback 处理登录回调
func (c *LogtoController) SignInCallback(ctx *gin.Context) {
	session := sessions.Default(ctx)
	logtoClient := client.NewLogtoClient(c.logtoConfig, NewSessionStorage(session))

	err := logtoClient.HandleSignInCallback(ctx.Request)
	if err != nil {
		response.ServerError(ctx, "登录回调处理失败", err.Error())
		return
	}

	// 重定向到首页或指定的页面
	redirectUri := os.Getenv("POST_SIGN_IN_REDIRECT_URI")
	if redirectUri == "" {
		redirectUri = "/"
	}

	ctx.Redirect(http.StatusTemporaryRedirect, redirectUri)
}

// SignOut 处理登出请求
func (c *LogtoController) SignOut(ctx *gin.Context) {
	session := sessions.Default(ctx)
	logtoClient := client.NewLogtoClient(c.logtoConfig, NewSessionStorage(session))

	signOutUri, err := logtoClient.SignOut(os.Getenv("POST_SIGN_OUT_REDIRECT_URI"))
	if err != nil {
		response.ServerError(ctx, "登出失败", err.Error())
		return
	}

	ctx.Redirect(http.StatusTemporaryRedirect, signOutUri)
}

// GetUserInfo 获取用户信息
func (c *LogtoController) GetUserInfo(ctx *gin.Context) {
	session := sessions.Default(ctx)
	logtoClient := client.NewLogtoClient(c.logtoConfig, NewSessionStorage(session))

	if !logtoClient.IsAuthenticated() {
		response.Unauthorized(ctx, "用户未登录", "请先登录后再访问此资源")
		return
	}

	userInfoResponse, err := logtoClient.FetchUserInfo()
	if err != nil {
		response.ServerError(ctx, "获取用户信息失败", err.Error())
		return
	}

	response.Success(ctx, "获取用户信息成功", userInfoResponse)
}

// GetIdTokenClaims 获取ID令牌声明
func (c *LogtoController) GetIdTokenClaims(ctx *gin.Context) {
	session := sessions.Default(ctx)
	logtoClient := client.NewLogtoClient(c.logtoConfig, NewSessionStorage(session))

	if !logtoClient.IsAuthenticated() {
		response.Unauthorized(ctx, "用户未登录", "请先登录后再访问此资源")
		return
	}

	idTokenClaims, err := logtoClient.GetIdTokenClaims()
	if err != nil {
		response.ServerError(ctx, "获取ID令牌声明失败", err.Error())
		return
	}

	response.Success(ctx, "获取ID令牌声明成功", idTokenClaims)
}
