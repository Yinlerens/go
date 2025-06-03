"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { toast } from "sonner";
import { authAPI } from "@/lib/auth-api";
import { useAuthStore } from "@/store/authStore";

const { Title, Text } = Typography;

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);
  const [verificationForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loginForm] = Form.useForm();

  // Zustand store
  const authStore = useAuthStore();
  const { user: currentUser, isAuthenticated, refreshToken: currentRefreshToken } = authStore;

  // 测试发送验证码
  const testSendCode = async (values: { email: string }) => {
    try {
      setLoading(true);
      const result = await authAPI.sendVerificationCode(values);

      if (result.code === "0") {
        toast.success(result.msg);
        console.log("验证码发送结果:", result);
      } else {
        toast.error(result.msg);
      }
    } catch (error) {
      toast.error("发送验证码失败");
      console.error("发送验证码错误:", error);
    } finally {
      setLoading(false);
    }
  };

  // 测试注册
  const testRegister = async (values: any) => {
    try {
      setLoading(true);
      const result = await authAPI.register(values);

      if (result.code === 200) {
        toast.success(result.msg);
        console.log("注册结果:", result);
        authStore.setAuth(result.data!);
      } else {
        toast.error(result.msg);
      }
    } catch (error) {
      toast.error("注册失败");
      console.error("注册错误:", error);
    } finally {
      setLoading(false);
    }
  };

  // 测试登录
  const testLogin = async (values: any) => {
    try {
      setLoading(true);
      const result = await authAPI.login(values);

      if (result.code === 200) {
        toast.success(result.msg);
        console.log("登录结果:", result);
        authStore.setAuth(result.data!);
      } else {
        toast.error(result.msg);
      }
    } catch (error) {
      toast.error("登录失败");
      console.error("登录错误:", error);
    } finally {
      setLoading(false);
    }
  };

  // 测试刷新token
  const testRefreshToken = async () => {
    try {
      setLoading(true);
      if (!currentRefreshToken) {
        toast.error("没有找到刷新令牌");
        return;
      }

      const result = await authAPI.refreshToken(currentRefreshToken);

      if (result.code === 200) {
        toast.success(result.msg);
        console.log("刷新token结果:", result);
        authStore.setAccessToken(result.data!.accessToken);
        authStore.setUser(result.data!.user);
      } else {
        toast.error(result.msg);
      }
    } catch (error) {
      toast.error("刷新token失败");
      console.error("刷新token错误:", error);
    } finally {
      setLoading(false);
    }
  };

  // 测试退出登录
  const testLogout = async () => {
    try {
      setLoading(true);
      if (!currentRefreshToken) {
        toast.error("没有找到刷新令牌");
        return;
      }

      const result = await authAPI.logout(currentRefreshToken);

      if (result.code === 200) {
        toast.success(result.msg);
        console.log("退出登录结果:", result);
        authStore.clearAuth();
      } else {
        toast.error(result.msg);
      }
    } catch (error) {
      toast.error("退出登录失败");
      console.error("退出登录错误:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Title level={2}>认证API测试页面</Title>

      {/* 当前状态 */}
      <Card title="当前状态" className="mb-6">
        <Space direction="vertical">
          <Text>登录状态: {isAuthenticated ? "已登录" : "未登录"}</Text>
          {currentUser && (
            <>
              <Text>用户ID: {currentUser.id}</Text>
              <Text>邮箱: {currentUser.email}</Text>
              <Text>昵称: {currentUser.nickname}</Text>
            </>
          )}
        </Space>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 发送验证码测试 */}
        <Card title="1. 发送验证码">
          <Form form={verificationForm} onFinish={testSendCode} layout="vertical">
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" }
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                发送验证码
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 注册测试 */}
        <Card title="2. 用户注册">
          <Form form={registerForm} onFinish={testRegister} layout="vertical">
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" }
              ]}
            >
              <Input placeholder="请输入邮箱地址" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              rules={[{ required: true, message: "请确认密码" }]}
            >
              <Input.Password placeholder="请再次输入密码" />
            </Form.Item>
            <Form.Item
              name="code"
              label="验证码"
              rules={[{ required: true, message: "请输入验证码" }]}
            >
              <Input placeholder="请输入6位验证码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 登录测试 */}
        <Card title="3. 用户登录">
          <Form form={loginForm} onFinish={testLogin} layout="vertical">
            <Form.Item
              name="username"
              label="用户名/邮箱"
              rules={[{ required: true, message: "请输入用户名或邮箱" }]}
            >
              <Input placeholder="请输入用户名或邮箱" />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 其他操作 */}
        <Card title="4. 其他操作">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button onClick={testRefreshToken} loading={loading} block>
              刷新Token
            </Button>
            <Button onClick={testLogout} loading={loading} block danger>
              退出登录
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
