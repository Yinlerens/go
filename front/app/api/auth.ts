import { request } from '@/utils/request';
export interface Request {
  password: string;
  username: string;
}
export interface LoginResponse {
  user_id: string;
  username: string;
  access_token: string;
}
export const register = (data: Request) => request.post('/register', data);

export const login = (data: Request) => request.post<LoginResponse>('/login', data);

interface ListUsersRequest {
  page?: number;
  page_size?: number;
  username:string
}
export interface User {
  created_at: Date;
  status: string;
  updated_at: Date;
  user_id: string;
  username: string;
}

interface ListUsersResponse {
  list: User[];
  total: number;
}
export const listUsers = (data: ListUsersRequest) => request.post<ListUsersResponse>("/users/list", data);

export const logout = () => request.post('/logout');
