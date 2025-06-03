import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "邮箱格式错误" }),
  password: z.string().min(6, { message: "密码格式错误" })
});

export const registerSchema = z
  .object({
    password: z.string().min(6, { message: "密码格式错误" }),
    confirmPassword: z.string(),
    email: z.string().email({ message: "邮箱格式错误" }),
    code: z.string().length(6, { message: "验证码格式错误" })
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"]
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
