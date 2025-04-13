"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RolePermissionForm } from "@/app/(home)/components/rbac/role-permission-form";
import { listRoles } from "@/app/api/rbac";
import { toast } from "sonner";

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
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
        // 实际应用中应该有getRoleById API，这里简化处理
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
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
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

  if (!role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/roles")}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">角色不存在</h2>
            <p className="text-muted-foreground mt-2">未找到请求的角色，请返回角色管理页面。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/roles")}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">权限管理: {role.name}</h2>
      </div>

      <RolePermissionForm roleKey={role.role_key} roleName={role.name} />
    </div>
  );
}
