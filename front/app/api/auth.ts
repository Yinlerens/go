import { request } from '@/utils/request';
interface Request {
  password: string;
  username: string;
}
interface LoginResponse {
  user_id: string;
  username: string;
  access_token: string;
}
export const register = (data: Request) => request.post('/auth/register', data);

export const login = (data: Request) => request.post<LoginResponse>('/auth/login', data);

export const logout = () => request.post('/auth/logout');
