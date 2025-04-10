// app/rbac/layout.tsx
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RbacLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">RBAC权限管理</h1>
        <p className="text-muted-foreground">管理系统角色、权限和用户的访问控制设置</p>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
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

      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
