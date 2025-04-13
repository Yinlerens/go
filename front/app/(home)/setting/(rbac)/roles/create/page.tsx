"use client";

import { RoleForm } from "@/app/(home)/components/rbac/role-form";
export default function CreateRolePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">创建角色</h2>
        <p className="text-muted-foreground mt-2">
          添加新角色，并设置基本信息。创建后可以分配权限。
        </p>
      </div>

      <div className="max-w-2xl">
        <RoleForm />
      </div>
    </div>
  );
}
