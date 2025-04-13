"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default function RbacLayout({ children }: { children: React.ReactNode }) {
  // 获取当前路径，用于设置活动的标签
  const pathname = usePathname();

  // 确定当前活动的标签
  let activeTab = "roles";
  if (pathname.includes("/permissions")) activeTab = "permissions";
  else if (pathname.includes("/users")) activeTab = "users";
  else if (pathname.includes("/audit-logs")) activeTab = "audit-logs";
  else if (pathname === "/rbac") activeTab = "overview";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">控制面板</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/roles">权限管理</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">RBAC权限管理</h1>
        <p className="text-muted-foreground">管理系统角色、权限和用户的访问控制设置</p>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href="/rbac">概览</Link>
          </TabsTrigger>
          <TabsTrigger value="roles" asChild>
            <Link href="/roles">角色管理</Link>
          </TabsTrigger>
          <TabsTrigger value="permissions" asChild>
            <Link href="/permissions">权限管理</Link>
          </TabsTrigger>
          <TabsTrigger value="users" asChild>
            <Link href="/users">用户角色</Link>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" asChild>
            <Link href="/audit-logs">审计日志</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">{children}</div>
    </div>
  );
}
