import * as z from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(2, { message: '用户名最小2位以上' })
    .max(10, { message: '用户名最大10位以下' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: '用户名格式错误,字母数字下划线'
    }),
  password: z.string().min(6, { message: '密码格式错误' })
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: '用户名最小2位以上' })
      .max(10, { message: '用户名最大10位以下' })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: '用户名格式错误,字母数字下划线'
      }),
    password: z.string().min(6, { message: '密码格式错误' }),
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword']
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
