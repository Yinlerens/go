# Next.js 15 & React Query v5 项目

本项目使用 Next.js 15 和 React Query v5 构建，封装了简洁易用的请求函数。

## 封装的 API 请求工具

项目中封装了基于 React Query v5 的 API 请求工具，提供了以下功能：

### 基础请求函数 (lib/request.ts)

```typescript
// 基本用法
import { request } from '@/lib/request';

// GET 请求
const data = await request<UserType>('/api/users');

// POST 请求
const result = await request<ResponseType>('/api/users', { 
  data: { name: 'John', email: 'john@example.com' }
});

// 自定义配置
const data = await request<DataType>('/api/resource', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  data: { id: 1, value: 'updated' }
});
```

### React Query 钩子 (lib/react-query.tsx)

```typescript
import { useQueryApi, useMutationApi } from '@/lib/react-query';

// 数据查询
function UserList() {
  const { data, isLoading, error } = useQueryApi(
    ['users'],
    '/api/users',
    {
      params: { page: 1, limit: 10 }
    }
  );
  
  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>出错了: {error.message}</div>;
  
  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 数据变更
function CreateUserForm() {
  const { mutate, isPending } = useMutationApi('/api/users');
  
  const handleSubmit = (userData) => {
    mutate(userData, {
      onSuccess: (data) => {
        console.log('创建成功:', data);
      }
    });
  };
  
  return (
    <form onSubmit={...}>
      {/* 表单内容 */}
      <button disabled={isPending}>
        {isPending ? '提交中...' : '创建用户'}
      </button>
    </form>
  );
}
```

## 全局配置

在 `app/providers.tsx` 文件中配置了 React Query 和其他全局提供者:

```tsx
import { ReactQueryProvider } from '@/lib/react-query';

export function Providers({ children }) {
  return (
    <ConfigProvider locale={zhCN} theme={...}>
      <ReactQueryProvider>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </ReactQueryProvider>
    </ConfigProvider>
  );
}
```

## 技术栈

- Next.js 15
- React 19
- React Query v5
- TypeScript
- Ant Design v5
- Tailwind CSS 4

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
