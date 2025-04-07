import { request } from '@/utils/request';
interface Request {
  password: string;
  username: string;
}
export const register = (data: Request) => request.post('/auth/register', data);

export const login = (data: Request) => request.post('/auth/login', data);

export const userStatus = (data: Request) => request.post('users/status', data);
