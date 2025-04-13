import { create } from "zustand";
// 导入 persist 中间件和存储辅助函数
import { persist, createJSONStorage } from "zustand/middleware";
import { login, LoginResponse, logout, Request } from "@/app/api/auth";

interface UserState {
  user: LoginResponse;
  loading: boolean;
  error: string | null;
  login: (value: Request) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<UserState>()(
  persist(
    set => ({
      user: {
        user_id: "",
        username: "",
        access_token: ""
      }, // 初始状态
      loading: false,
      error: null,

      // 获取用户菜单
      login: async value => {
        set({ loading: true, error: null });
        try {
          const { code, data, msg } = await login(value);

          if (code === 0 && data) {
            set({ user: data, loading: false });
          } else {
            set({ error: msg, loading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "登录时发生错误",
            loading: false
          });
        }
      },
      logout: async () => {
        set({ loading: true, error: null });
        try {
          const { code, msg } = await logout();
          if (code === 0) {
            set({
              user: {
                user_id: "",
                username: "",
                access_token: ""
              },
              loading: false
            });
          } else {
            set({ error: msg, loading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "发生错误",
            loading: false
          });
        }
      }
    }),
    // persist 中间件的配置选项
    {
      name: "user-storage", // 为你的存储选择一个唯一的名称
      storage: createJSONStorage(() => localStorage),

      partialize: state => ({ user: state.user })
    }
  )
);
