# 认证系统重构完成文档

本文档描述了项目中重构后的认证系统，包括token自动刷新、Zustand状态管理、函数式API等功能。

## 🎉 重构完成功能

### 1. **useQueryApi封装改进**
- ✅ 集成JWT token过期检测和自动刷新功能
- ✅ 支持请求重试机制
- ✅ 统一错误处理和响应格式
- ✅ 支持跳过认证和刷新的选项

### 2. **token自动刷新机制**
- ✅ 自动检测access token即将过期（提前5分钟）
- ✅ 自动调用refresh token API
- ✅ 原始请求自动重试
- ✅ refresh token过期时自动重定向到登录页面
- ✅ 防止并发刷新的Promise机制

### 3. **Zustand状态管理**
- ✅ 替换localStorage为Zustand状态管理
- ✅ 实现持久化存储（persist middleware）
- ✅ 统一管理用户信息、access token、refresh token
- ✅ 提供完整的actions来更新、清除认证状态

### 4. **函数式API重构**
- ✅ 将AuthAPI class重构为纯函数式API调用函数
- ✅ 所有API调用都通过增强的useQueryApi进行
- ✅ 保持向后兼容性
- ✅ 统一错误处理和响应格式

### 5. **集成完成**
- ✅ AuthForm组件已更新使用新的Zustand store
- ✅ 测试页面已更新验证所有功能
- ✅ token刷新逻辑对业务代码完全透明
- ✅ 保持现有API响应格式和错误处理逻辑

## API端点概览

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/verification` | POST | 发送邮箱验证码 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新访问令牌 |
| `/api/auth/logout` | POST/GET | 退出登录 |

## 1. 发送验证码 API

### 端点
```
POST /api/auth/verification
```

### 请求体
```json
{
  "email": "user@example.com"
}
```

### 响应
```json
{
  "data": {
    "token": "verification_token_here"
  },
  "code": "0",
  "msg": "验证码已发送，请检查您的邮箱"
}
```

### 错误响应
- `400`: 邮箱格式错误
- `429`: 发送频率限制（60秒内不能重复发送）
- `500`: 服务器错误

## 2. 用户注册 API

### 端点
```
POST /api/auth/register
```

### 请求体
```json
{
  "username": "testuser",
  "password": "password123",
  "confirmPassword": "password123",
  "email": "user@example.com",
  "code": "123456"
}
```

### 响应
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nickname": "testuser",
      "avatar": null,
      "status": "ACTIVE",
      "profileCompleted": false
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "code": 200,
  "msg": "注册成功"
}
```

### 错误响应
- `400`: 验证码无效、用户名已存在、邮箱已注册等
- `500`: 服务器错误

## 3. 用户登录 API

### 端点
```
POST /api/auth/login
```

### 请求体
```json
{
  "username": "testuser",  // 支持用户名或邮箱
  "password": "password123"
}
```

### 响应
```json
{
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nickname": "testuser",
      "avatar": null,
      "status": "ACTIVE",
      "profileCompleted": false,
      "phone": null,
      "bio": null
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "code": 200,
  "msg": "登录成功"
}
```

### 错误响应
- `401`: 用户名或密码错误
- `403`: 账户被禁用、暂停或封禁
- `500`: 服务器错误

## 4. 刷新令牌 API

### 端点
```
POST /api/auth/refresh
```

### 请求体
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### 响应
```json
{
  "data": {
    "accessToken": "new_jwt_access_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "nickname": "testuser",
      "avatar": null,
      "status": "ACTIVE",
      "profileCompleted": false
    }
  },
  "code": 200,
  "msg": "令牌刷新成功"
}
```

### 错误响应
- `401`: 刷新令牌无效或已过期
- `403`: 用户账户已被禁用
- `500`: 服务器错误

## 5. 退出登录 API

### 端点
```
POST /api/auth/logout
GET /api/auth/logout
```

### POST 请求体
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### GET 请求头
```
Authorization: Bearer jwt_access_token
```

### 响应
```json
{
  "data": null,
  "code": 200,
  "msg": "退出登录成功"
}
```

## 🚀 新的使用方式

### 1. Zustand状态管理

```typescript
import { useAuthStore } from "@/lib/auth-utils";

function MyComponent() {
  // 获取认证状态
  const { user, isAuthenticated, accessToken, refreshToken } = useAuthStore();

  // 获取actions
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  // 登录成功后存储认证信息
  const handleLoginSuccess = (authData) => {
    setAuth(authData); // 自动存储到localStorage并更新状态
  };

  // 退出登录
  const handleLogout = () => {
    clearAuth(); // 清除所有认证信息
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>欢迎, {user?.nickname}!</div>
      ) : (
        <div>请登录</div>
      )}
    </div>
  );
}
```

### 2. 函数式API调用

```typescript
import { authAPI } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-utils";

function AuthComponent() {
  const { setAuth } = useAuthStore();

  // 发送验证码
  const handleSendCode = async (email: string) => {
    const result = await authAPI.sendVerificationCode({ email });
    if (result.code === "0") {
      toast.success(result.msg);
    }
  };

  // 用户登录
  const handleLogin = async (credentials) => {
    const result = await authAPI.login(credentials);
    if (result.code === 200) {
      setAuth(result.data); // 自动存储到Zustand store
      router.push('/dashboard');
    }
  };

  // 用户注册
  const handleRegister = async (userData) => {
    const result = await authAPI.register(userData);
    if (result.code === 200) {
      setAuth(result.data); // 自动存储到Zustand store
      router.push('/dashboard');
    }
  };
}
```

### 3. 使用增强的useQueryApi

```typescript
import { useQueryApi, useMutationApi } from "@/lib/react-query";

function UserProfile() {
  // 自动处理token刷新的GET请求
  const { data: profile, isLoading } = useQueryApi(
    ['user', 'profile'],
    '/api/user/profile'
    // token会自动添加，过期时自动刷新
  );

  // 自动处理token刷新的POST请求
  const updateProfile = useMutationApi('/api/user/profile', {
    onSuccess: () => {
      toast.success('更新成功');
    }
  });

  const handleUpdate = (data) => {
    updateProfile.mutate(data); // 自动处理认证和token刷新
  };

  return (
    <div>
      {isLoading ? '加载中...' : (
        <div>
          <h1>{profile?.name}</h1>
          <button onClick={() => handleUpdate(newData)}>
            更新资料
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. 跳过认证的API调用

```typescript
import { useQueryApi } from "@/lib/react-query";

function PublicData() {
  // 公开API，跳过认证
  const { data } = useQueryApi(
    ['public', 'data'],
    '/api/public/data',
    {
      requestOptions: {
        skipAuth: true // 跳过认证头
      }
    }
  );

  return <div>{data?.content}</div>;
}
```

## 环境变量配置

确保在 `.env` 文件中配置以下环境变量：

```env
# 数据库连接
DATABASE_URL="your_database_url"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-change-this-in-production"

# 腾讯云SES邮件服务
TENCENT_SECRET_ID="your_tencent_secret_id"
TENCENT_SECRET_KEY="your_tencent_secret_key"
```

## 安全注意事项

1. **密码安全**: 使用 bcryptjs 进行密码哈希，盐轮数为12
2. **JWT安全**: 访问令牌有效期1小时，刷新令牌有效期7天
3. **验证码安全**: 验证码有效期15分钟，最多尝试3次
4. **频率限制**: 验证码发送间隔60秒
5. **用户状态**: 支持用户状态管理（活跃、非活跃、暂停、禁用）

## 测试

访问 `/test-auth` 页面可以测试所有API功能。
