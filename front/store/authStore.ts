import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 用户信息类型
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  status: string;
  profileCompleted: boolean;
  phone?: string;
  bio?: string;
}

// 认证状态类型
interface AuthState {
  // 状态
  user: User | null;
  accessToken: string;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (data: { user: User; accessToken: string }) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

// 创建认证状态管理
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      accessToken: '',
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: data => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
        });
      },

      setAccessToken: token => {
        set({ accessToken: token });
      },

      setUser: user => {
        set({ user });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: '',
          isAuthenticated: false,
        });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export class AuthUtils {
  static getAuthHeader(): string {
    const { accessToken } = useAuthStore.getState();
    return accessToken;
  }

  // 检查token是否即将过期（提前5分钟刷新）
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5分钟
      return exp - now < fiveMinutes;
    } catch (error) {
      console.error('解析token失败:', error);
      return true; // 如果解析失败，认为需要刷新
    }
  }

  // 检查token是否已过期
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();

      return now >= exp;
    } catch (error) {
      console.error('解析token失败:', error);
      return true; // 如果解析失败，认为已过期
    }
  }

  // 获取当前认证状态
  static getAuthState() {
    return useAuthStore.getState();
  }
}

// 默认导出
export default AuthUtils;
