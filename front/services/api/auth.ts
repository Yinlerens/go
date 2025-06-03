import { httpClient } from "@/lib/http-client";
import { LoginFormData, RegisterFormData } from "@/schemas/auth";

export const authApi = {
  login: (data: LoginFormData) => httpClient.post("/auth/login", data),
  register: (data: RegisterFormData) => httpClient.post("/auth/register", data),
  refresh: (data: { refreshToken: string }) => httpClient.post("/auth/refresh", data),
  logout: () => httpClient.post("/auth/logout"),
  sendVerificationCode: (data: { email: string }) => httpClient.post("/auth/verification", data)
};
