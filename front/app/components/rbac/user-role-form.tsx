"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserRoles, listRoles, assignRole, unassignRole } from "@/app/api/rbac";
import { toast } from "sonner";

// 角色类型
type Role = {
  role_key: string;
  name: string;
  description?: string;
};

interface UserRoleFormProps {
  userId: string;
  username: string;
}

export function UserRoleForm({ userId, username }: UserRoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // 加载用户角色和所有角色
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取用户当前角色
        const userRolesResponse = await getUserRoles({ user_id: userId });
        if (userRolesResponse.data) {
          setSelectedRoles(userRolesResponse.data.roles.map(r => r.role_key));
        }

        // 获取所有角色
        const allRolesResponse = await listRoles({ page_size: 100 });
        if (allRolesResponse.data) {
          setAllRoles(allRolesResponse.data.list);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 切换选择角色
  const toggleRole = async (roleKey: string, checked: boolean) => {
    try {
      if (checked) {
        // 添加角色
        await assignRole({
          user_id: userId,
          role_keys: [roleKey]
        });
        setSelectedRoles([...selectedRoles, roleKey]);
        toast.success(`已为用户 ${username} 分配角色`);
      } else {
        // 移除角色
        await unassignRole({
          user_id: userId,
          role_keys: [roleKey]
        });
        setSelectedRoles(selectedRoles.filter(key => key !== roleKey));
        toast.success(`已解除用户 ${username} 的角色`);
      }
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold">
          为用户 &quot;{username}&quot; ({userId}) 分配角色
        </h2>
        <p className="text-sm text-muted-foreground">
          选择要分配给此用户的角色。已选择 {selectedRoles.length} 个角色。
        </p>
      </div>

      {loading ? (
        <div className="text-center py-6">加载角色数据中...</div>
      ) : allRoles.length === 0 ? (
        <div className="text-center py-6">系统中暂无角色数据。请先创建角色，然后再分配给用户。</div>
      ) : (
        <ScrollArea className="h-full rounded-md border p-4">
          <div className="space-y-4">
            {allRoles.map(role => (
              <Card key={role.role_key} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {role.name}
                        <Badge variant="outline" className="font-mono text-xs">
                          {role.role_key}
                        </Badge>
                      </CardTitle>
                      {role.description && (
                        <CardDescription className="mt-1.5">{role.description}</CardDescription>
                      )}
                    </div>
                    <Checkbox
                      id={role.role_key}
                      checked={selectedRoles.includes(role.role_key)}
                      onCheckedChange={checked => toggleRole(role.role_key, checked as boolean)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedRoles.includes(role.role_key) ? "已分配给用户" : "未分配给用户"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleRole(role.role_key, !selectedRoles.includes(role.role_key))
                      }
                    >
                      {selectedRoles.includes(role.role_key) ? "取消分配" : "分配角色"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push("/users")}>
          返回用户列表
        </Button>
      </div>
    </div>
  );
}
