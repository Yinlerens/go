"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRoleForm } from "@/app/components/rbac/user-role-form";
import { listUsers, User } from "@/app/api/auth";

// 模拟数据 - 实际应用中应从认证服务获取
const mockUsers = [
  {
    user_id: "ece3d6e0-b705-4f11-b3c7-56cc4ee7f8c5",
    username: "admin",
    status: "active"
  },
  {
    user_id: "7b8a8c23-3d6f-412c-9c1a-68b5c0d75e9b",
    username: "user1",
    status: "active"
  },
  {
    user_id: "a4d9e7f2-1c5b-48e3-9a2d-8b6f59c31052",
    username: "operator",
    status: "active"
  },
  {
    user_id: "53b2c1e8-9a7d-4f5b-b0e3-1c6a8d9e2f7b",
    username: "guest",
    status: "active"
  }
];

export default function UserRolesPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.id as string;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>({} as User);

  useEffect(() => {
    const getListUsers = async () => {
      try {
        setLoading(true);
        const { code, data } = await listUsers({
          page: 1,
          page_size: 100,
          username
        });
        if (code === 0) {
          setUser(data.list[0]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    getListUsers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/users")}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">用户不存在</h2>
            <p className="text-muted-foreground mt-2">未找到请求的用户，请返回用户管理页面。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/users")}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">角色管理: {user.username}</h2>
      </div>

      <UserRoleForm userId={user.user_id} username={user.username} />
    </div>
  );
}
