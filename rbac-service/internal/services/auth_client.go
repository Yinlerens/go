// internal/services/auth_client.go
package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

// AuthClient 认证服务客户端接口
type AuthClient interface {
	ValidateUser(userID string) (bool, error)
}

// authClient 认证服务客户端实现
type authClient struct {
	authServiceURL string
	apiKey         string
	httpClient     *http.Client
}

// NewAuthClient 创建认证服务客户端
func NewAuthClient(authServiceURL, apiKey string) AuthClient {
	return &authClient{
		authServiceURL: authServiceURL,
		apiKey:         apiKey,
		httpClient:     &http.Client{},
	}
}

// 认证服务响应结构
type authResponse struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// ValidateUser 验证用户是否存在且状态为active
func (c *authClient) ValidateUser(userID string) (bool, error) {
	// 构建请求体
	reqBody, err := json.Marshal(map[string]string{
		"user_id": userID,
	})
	if err != nil {
		return false, err
	}

	// 创建HTTP请求
	url := fmt.Sprintf("%s/api/users/validate", c.authServiceURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return false, err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-API-Key", c.apiKey)

	// 发送请求
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	// 解析响应
	var authResp authResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return false, err
	}

	// 检查结果
	if authResp.Code != 0 {
		return false, errors.New(authResp.Msg)
	}

	return true, nil
}