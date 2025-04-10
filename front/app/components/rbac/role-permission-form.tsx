"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [open, setOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsByType, setPermissionsByType] = useState<PermissionsByType>({});
  const [filterValue, setFilterValue] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

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
          setFilteredPermissions(allPermsResponse.data.list);

          // 按类型分组权限
          const byType: PermissionsByType = {};
          allPermsResponse.data.list.forEach(perm => {
            if (!byType[perm.type]) {
              byType[perm.type] = [];
            }
            byType[perm.type].push(perm);
          });
          setPermissionsByType(byType);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 处理权限筛选
  useEffect(() => {
    let filtered = allPermissions;

    // 按类型筛选
    if (filterType) {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // 按搜索词筛选
    if (filterValue) {
      const lowerFilter = filterValue.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.permission_key.toLowerCase().includes(lowerFilter) ||
          p.name.toLowerCase().includes(lowerFilter) ||
          (p.description && p.description.toLowerCase().includes(lowerFilter))
      );
    }

    setFilteredPermissions(filtered);
  }, [filterValue, filterType, allPermissions]);

  // 切换选择权限
  const togglePermission = async (permissionKey: string, checked: boolean) => {
    try {
      if (checked) {
        // 添加权限
        await assignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });
        setSelectedPermissions([...selectedPermissions, permissionKey]);
      } else {
        // 移除权限
        await unassignPermission({
          role_key: roleKey,
          permission_keys: [permissionKey]
        });
        setSelectedPermissions(selectedPermissions.filter(key => key !== permissionKey));
      }
    } catch (error) {}
  };

  // 显示权限类型的友好名称
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
    const typeColors: Record<string, string> = {
      MENU: "bg-blue-500",
      BUTTON: "bg-green-500",
      API: "bg-purple-500"
    };
    return typeColors[type] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold">
          为角色 &quot;{roleName}&quot; ({roleKey}) 分配权限
        </h2>
        <p className="text-sm text-muted-foreground">
          选择要分配给此角色的权限。已选择 {selectedPermissions.length} 个权限。
        </p>
      </div>

      <div className="flex space-x-4 mb-4">
        {/* 权限类型筛选 */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {filterType ? getTypeLabel(filterType) : "所有权限类型"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                <CommandInput placeholder="搜索权限类型..." />
                <CommandEmpty>没有找到匹配的类型</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setFilterType(null);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", !filterType ? "opacity-100" : "opacity-0")}
                    />
                    所有权限类型
                  </CommandItem>
                  {Object.keys(permissionsByType).map(type => (
                    <CommandItem
                      key={type}
                      onSelect={() => {
                        setFilterType(type);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filterType === type ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {getTypeLabel(type)}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {permissionsByType[type].length}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 权限搜索 */}
        <div className="flex-1">
          <Command className="border rounded-md">
            <CommandInput
              placeholder="搜索权限..."
              value={filterValue}
              onValueChange={setFilterValue}
            />
          </Command>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6">加载权限数据中...</div>
      ) : filteredPermissions.length === 0 ? (
        <div className="text-center py-6">
          没有找到匹配的权限
          {filterType && <span> (当前筛选: {getTypeLabel(filterType)})</span>}
        </div>
      ) : (
        <ScrollArea className="h-full rounded-md border p-4">
          <div className="space-y-4">
            {Object.entries(permissionsByType)
              .filter(
                ([type, perms]) =>
                  (!filterType || type === filterType) &&
                  perms.some(
                    p =>
                      !filterValue ||
                      p.permission_key.toLowerCase().includes(filterValue.toLowerCase()) ||
                      p.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                      (p.description &&
                        p.description.toLowerCase().includes(filterValue.toLowerCase()))
                  )
              )
              .map(([type, _]) => (
                <Card key={type} className={cn(!filterType && "mb-6")}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-md flex items-center">
                      <div className={cn("w-3 h-3 rounded-full mr-2", getTypeColor(type))} />
                      {getTypeLabel(type)}
                    </CardTitle>
                    <CardDescription>
                      {type === "MENU" && "控制用户可访问的菜单项"}
                      {type === "BUTTON" && "控制用户可操作的按钮和功能"}
                      {type === "API" && "控制用户可调用的API接口"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredPermissions
                        .filter(p => p.type === type)
                        .map(permission => (
                          <div
                            key={permission.permission_key}
                            className="flex items-center space-x-2 hover:bg-muted p-2 rounded-md"
                          >
                            <Checkbox
                              id={permission.permission_key}
                              checked={selectedPermissions.includes(permission.permission_key)}
                              onCheckedChange={checked =>
                                togglePermission(permission.permission_key, checked as boolean)
                              }
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={permission.permission_key}
                                className="text-sm font-medium leading-none cursor-pointer flex items-center"
                              >
                                {permission.name}
                                {permission.description && (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80">
                                      <div className="space-y-2">
                                        <p className="text-sm">{permission.description}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                          {permission.permission_key}
                                        </p>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                )}
                              </label>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {permission.permission_key}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push("/roles")}>
          返回角色列表
        </Button>
      </div>
    </div>
  );
}
