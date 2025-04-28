// internal/services/rbac_client.go
package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"menu-service/internal/utils"
	"net/http"
)

// RbacClient RBAC服务客户端接口
type RbacClient interface {
	CheckPermissionExists(permissionKey string) (bool, error)
	GetUserPermissions(userID string) ([]string, error)
}

// rbacClient RBAC服务客户端实现
type rbacClient struct {
	rbacServiceURL string
	apiKey         string
	httpClient     *http.Client
}

// NewRbacClient 创建RBAC服务客户端
func NewRbacClient(rbacServiceURL, apiKey string) RbacClient {
	return &rbacClient{
		rbacServiceURL: rbacServiceURL,
		apiKey:         apiKey,
		httpClient:     &http.Client{},
	}
}

// RBAC服务响应结构
type rbacResponse struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data"`
}

// CheckPermissionExists 检查权限标识是否存在于RBAC系统
func (c *rbacClient) CheckPermissionExists(permissionKey string) (bool, error) {
	// 构建请求体 (这里假设RBAC服务有一个验证权限是否存在的接口)
	reqBody, err := json.Marshal(map[string]string{
		"permission_key": permissionKey,
	})
	if err != nil {
		return false, err
	}

	// 创建HTTP请求
	url := fmt.Sprintf("%s/api/v1/rbac/permissions/exists", c.rbacServiceURL)
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
	var rbacResp rbacResponse
	if err := json.NewDecoder(resp.Body).Decode(&rbacResp); err != nil {
		return false, err
	}

	// 检查结果
	if rbacResp.Code != 0 {
		return false, errors.New(rbacResp.Msg)
	}

	// 解析data字段
	data, ok := rbacResp.Data.(map[string]interface{})
	if !ok {
		return false, errors.New("响应格式错误")
	}

	exists, ok := data["exists"].(bool)
	if !ok {
		return false, errors.New("响应格式错误")
	}

	return exists, nil
}

// GetUserPermissions 获取用户权限列表
func (c *rbacClient) GetUserPermissions(userID string) ([]string, error) {
	// 构建请求体
	reqBody, err := json.Marshal(map[string]interface{}{
		"user_id": userID,
	})
	if err != nil {
		utils.Info("错误", err.Error())
		return nil, err
	}

	// 创建HTTP请求
	url := fmt.Sprintf("%s/api/v1/rbac/users/permissions", c.rbacServiceURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		utils.Info("错误", err.Error())
		return nil, err
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-API-Key", c.apiKey)

	// 发送请求
	resp, err := c.httpClient.Do(req)
	if err != nil {
		utils.Info("错误", err.Error())
		return nil, err
	}
	defer resp.Body.Close()

	// 解析响应
	var rbacResp rbacResponse
	if err := json.NewDecoder(resp.Body).Decode(&rbacResp); err != nil {
		utils.Info("错误", err.Error())
		return nil, err
	}

	// 检查结果
	if rbacResp.Code != 0 {
		return nil, errors.New(rbacResp.Msg)
	}

	// 解析data字段
	data, ok := rbacResp.Data.(map[string]interface{})
	if !ok {
		return nil, errors.New("响应格式错误")
	}

	permissionsData, ok := data["permissions"].([]interface{})
	if !ok {
		return nil, errors.New("响应格式错误")
	}

	// 提取权限Key
	permissionKeys := make([]string, 0, len(permissionsData))
	for _, perm := range permissionsData {
		permObj, ok := perm.(map[string]interface{})
		if !ok {
			continue
		}

		key, ok := permObj["permission_key"].(string)
		if !ok {
			continue
		}

		permissionKeys = append(permissionKeys, key)
	}

	return permissionKeys, nil
}