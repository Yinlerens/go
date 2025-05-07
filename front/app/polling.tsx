// components/LocalStorageListener.js
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/user-store";

export default function LocalStorageListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { access_token, setAccessToken } = useAuthStore();

  // 将 pathname 添加到依赖项
  useEffect(() => {
    if (!access_token && pathname !== "/" && pathname !== "/auth") {
      // 如果没有 access_token 且当前路径不是 /auth，则跳转到 /authentication
      router.push("/auth");
      toast.error("请先登录！"); // 显示错误提示
      // 跳转完成后，清空状态，避免再次触发跳转
      setAccessToken("");
    }
  }, [access_token, router]);
  return <></>;
}
