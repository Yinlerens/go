"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PermissionForm } from "@/app/(home)/components/rbac/permission-form";
import { Skeleton } from "@/components/ui/skeleton";
import { listPermissions } from "@/app/api/rbac";

export default function EditPermissionPage() {
  const params = useParams();
  const permissionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<{
    permission_key: string;
    name: string;
    type: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        setLoading(true);
        // 实际应用中应该有getPermissionById API，这里简化处理
        const response = await listPermissions({ page: 1, page_size: 100 });
        if (response.data) {
          const foundPermission = response.data.list.find(p => p.permission_key === permissionId);
          if (foundPermission) {
            setPermission(foundPermission);
          } else {
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
  }, [permissionId]);

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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!permission) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">权限不存在</h2>
          <p className="text-muted-foreground mt-2">未找到请求的权限，请返回权限管理页面。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">编辑权限</h2>
        <p className="text-muted-foreground mt-2">修改权限信息，权限标识不可更改。</p>
      </div>

      <div className="max-w-2xl">
        <PermissionForm initialData={permission} isEdit />
      </div>
    </div>
  );
}
