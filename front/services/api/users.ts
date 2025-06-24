import { useApiQuery } from '@/hooks/use-api-query';
import { httpClient } from '@/lib/http-client';
import { z } from 'zod';
// 用户数据验证Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// 用户API服务
export const userApi = {
  // 获取用户列表
  getUsers: (params?: { page?: number; pageSize?: number }) =>
    httpClient.get<User[]>('/users', { params }),

  // 获取单个用户
  getUser: (id: string) => httpClient.get<User>(`/users/${id}`),

  // 创建用户
  createUser: (data: CreateUserDto) => {
    const validatedData = CreateUserSchema.parse(data);
    return httpClient.post<User>('/users', validatedData);
  },

  // 更新用户
  updateUser: (id: string, data: UpdateUserDto) => {
    const validatedData = UpdateUserSchema.parse(data);
    return httpClient.put<User>(`/users/${id}`, validatedData);
  },

  // 删除用户
  deleteUser: (id: string) => httpClient.delete<void>(`/users/${id}`),

  getUserMenus: () => {
    return useApiQuery<any[]>(
      ['user-menus'], // queryKey
      '/user/menus', // 你的菜单 API 路径
      {}, // 没有额外的 axios config
      {
        staleTime: 1000 * 60 * 5, // 5分钟内数据保持新鲜
        retry: 2, // 失败重试2次
      }
    );
  },
};
