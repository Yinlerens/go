"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RoleForm } from "@/app/components/rbac/role-form";
import { Skeleton } from "@/components/ui/skeleton";
import { listRoles } from "@/app/api/rbac";
import { toast } from "sonner";

export default function EditRolePage() {
  const params = useParams();
  const roleId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<{
    role_key: string;
    name: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        // 实际应用中应该有getRole(roleId)API，这里简化处理
        const response = await listRoles();
        if (response.data) {
          const foundRole = response.data.list.find(r => r.role_key === roleId);
          if (foundRole) {
            setRole(foundRole);
          } else {
            toast.error("角色不存在");
          }
        }
      } catch (error) {
        console.error("Failed to fetch role:", error);
        toast.error("获取角色信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </div>

        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">角色不存在</h2>
          <p className="text-muted-foreground mt-2">未找到请求的角色，请返回角色管理页面。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">编辑角色</h2>
        <p className="text-muted-foreground mt-2">修改角色信息，角色标识不可更改。</p>
      </div>

      <div className="max-w-2xl">
        <RoleForm initialData={role} isEdit />
      </div>
    </div>
  );
}
