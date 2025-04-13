"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Shield, Info, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  getRolePermissions,
  listPermissions,
  assignPermission,
  unassignPermission
} from "@/app/api/rbac";
import { toast } from "sonner";

// 权限类型
type Permission = {
  permission_key: string;
  name: string;
  type: string;
  description?: string;
};

// 按权限类型分组
type PermissionsByType = {
  [type: string]: Permission[];
};

interface RolePermissionFormProps {
  roleKey: string;
  roleName: string;
}

export function RolePermissionForm({ roleKey, roleName }: RolePermissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsByType, setPermissionsByType] = useState<PermissionsByType>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // 加载角色权限和所有权限
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取角色当前权限
        const rolePermsResponse = await getRolePermissions({ role_key: roleKey });
        if (rolePermsResponse.data) {
          setSelectedPermissions(rolePermsResponse.data.permissions.map(p => p.permission_key));
        }

        // 获取所有权限
        const allPermsResponse = await listPermissions({ page_size: 500 });
        if (allPermsResponse.data) {
          setAllPermissions(allPermsResponse.data.list);

          // 按类型分组权限
          const byType: PermissionsByType = {};
          allPermsResponse.data.list.forEach(perm => {
            if (!byType[perm.type]) {
              byType[perm.type] = [];
            }
            byType[perm.type].push(perm);
          });
          setPermissionsByType(byType);

          // 如果有类型，设置第一个类型为默认活动标签
          if (Object.keys(byType).length > 0) {
            setActiveTab("ALL");
          }
        }
      } catch (error) {
        toast.error("获取权限数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleKey]);

  // 获取过滤后的权限
  const getFilteredPermissions = () => {
    let filtered = allPermissions;

    // 按类型过滤
    if (activeTab !== "ALL") {
      filtered = filtered.filter(p => p.type === activeTab);
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.permission_key.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredPermissions = getFilteredPermissions();

  // 切换选择权限
  const togglePermission = async (permissionKey: string, checked: boolean) => {
    try {
      if (checked) {
        // 添加权限
        await assignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });
        setSelectedPermissions(prev => [...prev, permissionKey]);
        toast.success(`已为角色 "${roleName}" 分配权限`);
      } else {
        // 移除权限
        await unassignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });
        setSelectedPermissions(prev => prev.filter(key => key !== permissionKey));
        toast.success(`已从角色 "${roleName}" 移除权限`);
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // 获取权限类型标签
  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      MENU: "菜单权限",
      BUTTON: "按钮权限",
      API: "接口权限"
    };
    return typeLabels[type] || type;
  };

  // 获取权限类型的颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case "MENU":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "BUTTON":
        return "bg-green-100 text-green-800 border-green-200";
      case "API":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* 角色信息和搜索栏 */}
      <div className="bg-muted/40 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-medium text-lg">{roleName}</h3>
            <p className="text-xs text-muted-foreground font-mono">{roleKey}</p>
          </div>
          <Badge className="ml-2">{selectedPermissions.length} 个权限</Badge>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索权限..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 标签切换器和权限列表 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="ALL"
              className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              全部
              <Badge variant="outline" className="ml-2 bg-muted">
                {allPermissions.length}
              </Badge>
            </TabsTrigger>

            {Object.entries(permissionsByType).map(([type, perms]) => (
              <TabsTrigger
                key={type}
                value={type}
                className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {getTypeLabel(type)}
                <Badge variant="outline" className="ml-2 bg-muted">
                  {perms.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="flex-1 mt-0 border-none p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Filter className="h-10 w-10 mb-4 opacity-30" />
              <p>没有找到匹配的权限</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                  清除搜索条件
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4 mt-4 h-[calc(100vh-320px)] min-h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 pb-6">
                {filteredPermissions.map(permission => (
                  <div
                    key={permission.permission_key}
                    className={cn(
                      "group border rounded-lg transition-all duration-200 hover:shadow-md",
                      selectedPermissions.includes(permission.permission_key)
                        ? "bg-muted/70 border-primary/30"
                        : "bg-background hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="p-3 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTypeColor(permission.type))}
                          >
                            {getTypeLabel(permission.type)}
                          </Badge>

                          {permission.description && (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-2">
                                  <p className="text-sm">{permission.description}</p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>

                        <h4 className="text-sm font-medium line-clamp-1 mb-1">{permission.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {permission.permission_key}
                        </p>
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant={
                            selectedPermissions.includes(permission.permission_key)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={
                            selectedPermissions.includes(permission.permission_key)
                              ? "gap-1"
                              : "opacity-0 group-hover:opacity-100 transition-opacity"
                          }
                          onClick={() =>
                            togglePermission(
                              permission.permission_key,
                              !selectedPermissions.includes(permission.permission_key)
                            )
                          }
                        >
                          {selectedPermissions.includes(permission.permission_key) ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> 已分配
                            </>
                          ) : (
                            "分配"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
