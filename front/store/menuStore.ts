import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface MenuState {
  user: User | null;
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<MenuState>()(
  persist(
    (set, get) => ({
      user: null,
      setAuth: data => {
        set({
          user: data.user
        });
      }
    }),
    {
      name: "menu-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user
      })
    }
  )
);

export default MenuState;
