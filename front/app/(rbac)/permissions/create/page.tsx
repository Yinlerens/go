"use client";

import { PermissionForm } from "@/app/components/rbac/permission-form";

export default function CreatePermissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">创建权限</h2>
        <p className="text-muted-foreground mt-2">
          添加新权限，并设置基本信息。此权限可以稍后分配给角色。
        </p>
      </div>

      <div className="max-w-2xl">
        <PermissionForm />
      </div>
    </div>
  );
}
