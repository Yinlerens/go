"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Shield,
  Lock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Check,
  Plus,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

interface RolePermissionFormProps {
  roleKey: string;
  roleName: string;
}

export function RolePermissionForm({ roleKey, roleName }: RolePermissionFormProps) {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsByType, setPermissionsByType] = useState<Record<string, Permission[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState<string[]>([]);

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
        const allPermsResponse = await listPermissions({ page_size: 100 });
        if (allPermsResponse.data) {
          setAllPermissions(allPermsResponse.data.list);

          // 按类型分组权限
          const byType: Record<string, Permission[]> = { ALL: allPermsResponse.data.list };

          // 构建类型分组
          allPermsResponse.data.list.forEach(perm => {
            if (!byType[perm.type]) {
              byType[perm.type] = [];
            }
            byType[perm.type].push(perm);
          });

          setPermissionsByType(byType);
        }
      } catch (error) {
        toast.error("获取权限数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleKey]);

  // 处理搜索，高亮匹配权限
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchedKeys = allPermissions
        .filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.permission_key.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        )
        .map(p => p.permission_key);

      setSearchHighlight(matchedKeys);
    } else {
      setSearchHighlight([]);
    }
  }, [searchQuery, allPermissions]);

  // 获取当前视图的权限
  const currentViewPermissions = useMemo(() => {
    // 基于当前标签过滤权限
    let filteredPerms = activeTab === "ALL" ? allPermissions : permissionsByType[activeTab] || [];

    // 应用搜索过滤
    if (searchQuery.trim() && searchHighlight.length > 0) {
      filteredPerms = filteredPerms.filter(p => searchHighlight.includes(p.permission_key));
    }

    return filteredPerms;
  }, [activeTab, permissionsByType, allPermissions, searchQuery, searchHighlight]);

  // 按状态分组的权限
  const permissionsByStatus = useMemo(() => {
    const assigned = currentViewPermissions.filter(p =>
      selectedPermissions.includes(p.permission_key)
    );

    const unassigned = currentViewPermissions.filter(
      p => !selectedPermissions.includes(p.permission_key)
    );

    return { assigned, unassigned };
  }, [currentViewPermissions, selectedPermissions]);

  // 切换选择权限
  const togglePermission = async (permissionKey: string, checked: boolean) => {
    try {
      if (checked) {
        // 添加权限
        const response = await assignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });

        if (response.code === 0) {
          setSelectedPermissions(prev => [...prev, permissionKey]);
          toast.success(`已为角色 "${roleName}" 分配权限`);
        }
      } else {
        // 移除权限
        const response = await unassignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });

        if (response.code === 0) {
          setSelectedPermissions(prev => prev.filter(key => key !== permissionKey));
          toast.success(`已从角色 "${roleName}" 移除权限`);
        }
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // 刷新数据
  const refreshData = async () => {
    setRefreshing(true);
    try {
      const rolePermsResponse = await getRolePermissions({ role_key: roleKey });
      if (rolePermsResponse.data) {
        setSelectedPermissions(rolePermsResponse.data.permissions.map(p => p.permission_key));
        toast.success("权限数据已刷新");
      }
    } catch (error) {
      toast.error("刷新数据失败");
    } finally {
      setRefreshing(false);
    }
  };

  // 根据类型获取颜色
  const getTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      MENU: "bg-blue-100 text-blue-800 border-blue-200",
      BUTTON: "bg-amber-100 text-amber-800 border-amber-200",
      API: "bg-emerald-100 text-emerald-800 border-emerald-200",
      DATA: "bg-cyan-100 text-cyan-800 border-cyan-200",
      ADMIN: "bg-violet-100 text-violet-800 border-violet-200",
      VIEW: "bg-rose-100 text-rose-800 border-rose-200",
      SECURITY: "bg-red-100 text-red-800 border-red-200"
    };
    return colorMap[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    // 使用Flexbox布局，让内容区域自动填充可用空间
    <div className="flex flex-col h-full">
      {/* 头部信息区域 - 使用flex-none防止收缩 */}
      <div className="flex-none space-y-4 p-4">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground rounded-full p-2.5">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{roleName}</h3>
            <p className="text-sm text-muted-foreground">
              已分配{" "}
              <span className="font-semibold text-primary">{selectedPermissions.length}</span>{" "}
              个权限
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索权限..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 rounded-lg border-muted-foreground/20 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-6 w-6 text-muted-foreground"
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 sm:flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupByStatus(!groupByStatus)}
              className={groupByStatus ? "bg-primary/10" : ""}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              {groupByStatus ? "已分组" : "按状态分组"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 标签页和内容区域 - flex-grow-1确保充满剩余空间 */}
      <div className="flex-grow flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          {/* 标签导航 - 固定高度 */}
          <div className="flex-none border-b w-full overflow-x-auto no-scrollbar">
            <TabsList className="h-10 justify-start rounded-none bg-transparent p-0 inline-flex min-w-max">
              <TabsTrigger
                value="ALL"
                className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                全部
                <Badge variant="outline" className="ml-1.5 bg-muted">
                  {allPermissions.length}
                </Badge>
              </TabsTrigger>

              {Object.entries(permissionsByType)
                .filter(([type]) => type !== "ALL")
                .map(([type, perms]) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{type}</span>
                      <Badge variant="outline" className="bg-muted/50">
                        {perms.length}
                      </Badge>
                    </div>
                  </TabsTrigger>
                ))}
            </TabsList>
          </div>

          {/* 内容区域 - 填充剩余空间并允许滚动 */}
          <TabsContent
            value={activeTab}
            className="flex-grow mt-0 p-0 overflow-hidden min-h-0 flex flex-col"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">加载权限数据中...</p>
              </div>
            ) : currentViewPermissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
                <Shield className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground">没有找到匹配的权限</p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    清除搜索条件
                  </Button>
                )}
              </div>
            ) : (
              // 滚动区域 - 使用flex-grow和overflow-auto确保可滚动
              <div className="flex-grow overflow-auto pt-2 pb-4 px-4">
                {/* 按状态分组视图 */}
                {groupByStatus ? (
                  <div className="space-y-6">
                    {/* 已分配权限组 */}
                    {permissionsByStatus.assigned.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            已分配
                          </Badge>
                          <div className="h-px flex-1 bg-muted"></div>
                          <span className="text-sm text-muted-foreground">
                            {permissionsByStatus.assigned.length} 项
                          </span>
                        </div>

                        <div className="border rounded-lg overflow-hidden divide-y">
                          {permissionsByStatus.assigned.map(permission => (
                            <PermissionItem
                              key={permission.permission_key}
                              permission={permission}
                              isAssigned={true}
                              highlight={searchHighlight.includes(permission.permission_key)}
                              onToggle={togglePermission}
                              getTypeColor={getTypeColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 未分配权限组 */}
                    {permissionsByStatus.unassigned.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            未分配
                          </Badge>
                          <div className="h-px flex-1 bg-muted"></div>
                          <span className="text-sm text-muted-foreground">
                            {permissionsByStatus.unassigned.length} 项
                          </span>
                        </div>

                        <div className="border rounded-lg overflow-hidden divide-y">
                          {permissionsByStatus.unassigned.map(permission => (
                            <PermissionItem
                              key={permission.permission_key}
                              permission={permission}
                              isAssigned={false}
                              highlight={searchHighlight.includes(permission.permission_key)}
                              onToggle={togglePermission}
                              getTypeColor={getTypeColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 常规列表视图
                  <div className="border rounded-lg overflow-hidden divide-y">
                    {currentViewPermissions.map(permission => (
                      <PermissionItem
                        key={permission.permission_key}
                        permission={permission}
                        isAssigned={selectedPermissions.includes(permission.permission_key)}
                        highlight={searchHighlight.includes(permission.permission_key)}
                        onToggle={togglePermission}
                        getTypeColor={getTypeColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 权限列表项组件 - 没有动画效果
function PermissionItem({
  permission,
  isAssigned,
  highlight,
  onToggle,
  getTypeColor
}: {
  permission: Permission;
  isAssigned: boolean;
  highlight: boolean;
  onToggle: (key: string, checked: boolean) => void;
  getTypeColor: (type: string) => string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 hover:bg-muted/30 group transition-colors",
        highlight && "bg-primary/5",
        isAssigned && "border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Badge variant="outline" className={cn("shrink-0", getTypeColor(permission.type))}>
          {permission.type}
        </Badge>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-medium text-sm truncate">{permission.name}</h4>

            {isAssigned && (
              <Badge variant="outline" className="border-primary/40 text-primary shrink-0">
                <Check className="h-3 w-3 mr-1" />
                已分配
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-muted-foreground truncate">
              {permission.permission_key}
            </span>

            {permission.description && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground shrink-0"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="start" className="max-w-md">
                  <p className="text-sm">{permission.description}</p>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-4">
        <Button
          variant={isAssigned ? "destructive" : "default"}
          size="sm"
          onClick={() => onToggle(permission.permission_key, !isAssigned)}
          className={cn(isAssigned ? "bg-red-500/90 hover:bg-red-600" : "bg-primary")}
        >
          {isAssigned ? (
            <>
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              移除
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              分配
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
