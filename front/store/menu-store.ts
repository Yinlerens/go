import { create } from "zustand";
// 导入 persist 中间件和存储辅助函数
import { persist, createJSONStorage } from "zustand/middleware";
import { UserMenuNode } from "@/app/(home)/setting/menus/menu";
import { getUserMenu } from "@/app/api/menu";

interface MenuState {
  // 菜单数据 (将被持久化)
  menuItems: UserMenuNode[];
  // 加载状态 (不持久化)
  loading: boolean;
  // 错误信息 (不持久化)
  error: string | null;
  // 获取菜单的方法
  fetchMenu: (userId: string) => Promise<boolean>;
  // 重置菜单状态 (会清除持久化的 menuItems)
  resetMenu: () => void;
}

// 创建持久化的菜单状态管理 store
// 注意 create<MenuState>() 后面的额外括号 ()，在使用中间件时需要这样写
export const useMenuStore = create<MenuState>()(
  // 使用 persist 中间件包裹 store 定义
  persist(
    // 原始的 store 定义函数 (接收 set, get, api 作为参数)
    set => ({
      menuItems: [], // 初始状态
      loading: false,
      error: null,

      // 获取用户菜单
      fetchMenu: async (userId: string) => {
        // 设置加载状态，清除之前的错误。不立即清除 menuItems，让 UI 先显示加载状态
        set({ loading: true, error: null });
        try {
          const response = await getUserMenu({ user_id: userId });

          if (response.code === 0 && response.data) {
            // 成功获取数据，更新 menuItems - 这会被 persist 中间件自动保存
            set({ menuItems: response.data.items, loading: false });
            return true;
          } else {
            // set({ menuItems: [], error: response.msg || "获取菜单失败", loading: false }); // 选项1: 出错时清除
            set({ error: response.msg || "获取菜单失败", loading: false }); // 选项2: 保留旧数据
            return false;
          }
        } catch (error) {
          // 捕获到异常，设置错误信息
          // 同样，你可以选择清除 menuItems 或保留旧数据
          // set({ menuItems: [], error: error instanceof Error ? error.message : "获取菜单失败", loading: false }); // 选项1: 出错时清除
          set({
            error: error instanceof Error ? error.message : "获取菜单失败",
            loading: false
          }); // 选项2: 保留旧数据
          return false;
        }
      },

      // 重置菜单状态
      resetMenu: () => {
        // 重置状态，包括持久化的 menuItems 也会被清空并保存为空数组
        set({ menuItems: [], loading: false, error: null });
      }
    }),
    // persist 中间件的配置选项
    {
      // 1. name: 存储条目的唯一名称 (必需)
      //    这是在 localStorage 或 sessionStorage 中使用的键名。
      name: "menu-storage", // 为你的存储选择一个唯一的名称

      // 2. storage: 指定存储介质 (可选)
      //    默认为 localStorage。推荐使用 createJSONStorage 来包装。
      //    - localStorage: 数据会持久保存在浏览器中，关闭浏览器或标签页后依然存在。
      //    - sessionStorage: 数据仅在当前浏览器标签页的会话期间保存，关闭标签页后数据会丢失。
      storage: createJSONStorage(() => localStorage), // 或者使用 sessionStorage: createJSONStorage(() => sessionStorage)

      // 3. partialize: 选择要持久化的状态部分 (可选)
      //    接收完整 state，返回一个只包含你想持久化部分的对象。
      //    这里我们只想持久化 'menuItems'。
      partialize: state => ({ menuItems: state.menuItems })

      // 4. (可选) onRehydrateStorage: Storage 被读取并准备好水合时的回调函数
      //    可以用来处理水合过程中的错误或执行一些初始化操作。
      // onRehydrateStorage: (state) => {
      //   console.log("开始水合 menu store...");
      //   // 返回一个可选的回调，在水合完成后执行
      //   return (hydratedState, error) => {
      //     if (error) {
      //       console.error("菜单 store 水合过程中发生错误:", error);
      //       // 可以在这里处理错误，例如清除损坏的存储或重置状态
      //     } else {
      //       console.log("菜单 store 水合完成");
      //       // 可以在水合后执行操作，比如检查数据是否为空/过时，并触发数据获取
      //       // if (!hydratedState?.menuItems?.length) {
      //       //   useMenuStore.getState().fetchMenu(someUserId); // 示例：如果水合后菜单为空，则获取
      //       // }
      //     }
      //   }
      // },

      // 5. (可选) version: 状态版本号，用于状态迁移 (可选)
      //    当你更改了持久化状态的结构时，可以使用版本号和 migrate 函数来处理旧版本数据。
      // version: 1, // 当前状态版本
      // migrate: (persistedState, version) => {
      //   // persistedState 是从存储中读取的旧状态
      //   // version 是旧状态的版本号
      //   if (version === 0) {
      //     // 从版本 0 迁移到版本 1 的逻辑
      //     // 例如：(persistedState as any).newMenuItems = persistedState.menuItems;
      //     // delete (persistedState as any).menuItems;
      //   }
      //   return persistedState as MenuState; // 返回迁移后的状态
      // },
    }
  )
);
