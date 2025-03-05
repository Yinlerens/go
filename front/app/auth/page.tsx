'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 登录表单验证 Schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的电子邮件'),
  password: z.string().min(6, '密码至少6位')
});

// 注册表单验证 Schema
const registerSchema = z
  .object({
    username: z.string().min(3, '用户名至少3位'),
    email: z.string().email('请输入有效的电子邮件'),
    password: z.string().min(6, '密码至少6位'),
    confirmPassword: z.string().min(6, '密码至少6位')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '密码不匹配',
    path: ['confirmPassword']
  });

// 类型定义
type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');

  // 登录表单
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  // 注册表单
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  // 登录提交处理
  const onLoginSubmit = (data: LoginFormData) => {
    console.log('Login data:', data);
    // TODO: 实现登录逻辑，例如调用 API
  };

  // 注册提交处理
  const onRegisterSubmit = (data: RegisterFormData) => {
    console.log('Register data:', data);
    // TODO: 实现注册逻辑，例如调用 API
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6 rounded-lg shadow-md">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          {/* 登录表单 */}
          <TabsContent value="login">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
            </CardHeader>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">电子邮件</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入你的电子邮件"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-sm">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入你的密码"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-sm">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardContent>
                <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  登录
                </Button>
              </CardContent>
            </form>
          </TabsContent>

          {/* 注册表单 */}
          <TabsContent value="register">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
            </CardHeader>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入你的用户名"
                    {...registerForm.register('username')}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-red-500 text-sm">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">电子邮件</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入你的电子邮件"
                    {...registerForm.register('email')}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-sm">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入你的密码"
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-sm">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="请再次输入密码"
                    {...registerForm.register('confirmPassword')}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardContent>
                <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  注册
                </Button>
              </CardContent>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
