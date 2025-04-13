"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateMenuItem, createMenuItem } from "@/app/api/menu";
import { MenuNode } from "@/app/menu/menu";
import { listPermissions } from "@/app/api/rbac";

// 权限类型
type Permission = {
  permission_key: string;
  name: string;
  type: string;
  description?: string;
};

// 表单验证模式
const menuItemSchema = z.object({
  name: z.string().min(1, { message: "名称为必填项" }),
  path: z
    .string()
    .min(1, { message: "路径为必填项" })
    .regex(/^\/[a-zA-Z0-9_\-/]*$/, {
      message: "路径必须以/开头，只能包含字母、数字、下划线、连字符和斜杠"
    }),
  icon: z.string().optional(),
  permission_key: z.string().optional(),
  order: z.coerce.number().int().default(0),
  is_enabled: z.boolean().default(true),
  meta: z.any().optional()
});

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  item?: MenuNode;
  parentId?: string | null;
  onSuccess: () => void;
}

export function MenuForm({ item, parentId, onSuccess }: MenuFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const isEditing = !!item;

  // 获取权限列表
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await listPermissions({ page_size: 500, type: "MENU" });
        if (response.data) {
          const menuPermissions = response.data.list;
          setPermissions(menuPermissions);
          setFilteredPermissions(menuPermissions);
        }
      } catch (error) {
        console.error("获取权限列表失败:", error);
      }
    };

    fetchPermissions();
  }, []);

  // 根据是编辑还是创建设置默认值
  const defaultValues: Partial<MenuFormValues> = {
    name: item?.name || "",
    path: item?.path || "/",
    icon: item?.icon || "",
    permission_key: item?.permission_key || "",
    order: item?.order || 0,
    is_enabled: item?.is_enabled !== undefined ? item.is_enabled : true,
    meta: item?.meta || {}
  };

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues
  });

  // 处理权限搜索
  const handlePermissionSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredPermissions(permissions);
      return;
    }

    const lowerCaseValue = value.toLowerCase();
    const filtered = permissions.filter(
      permission =>
        permission.name.toLowerCase().includes(lowerCaseValue) ||
        permission.permission_key.toLowerCase().includes(lowerCaseValue)
    );
    setFilteredPermissions(filtered);
  };

  const onSubmit = async (values: MenuFormValues) => {
    try {
      setIsSubmitting(true);

      if (isEditing && item) {
        // 更新现有菜单项
        const response = await updateMenuItem({
          id: item.id,
          ...values,
          parent_id: item.parent_id as string
        });

        if (response.code === 0) {
          toast.success("菜单项更新成功");
          onSuccess();
        }
      } else {
        // 创建新菜单项
        const response = await createMenuItem({
          ...values,
          parent_id: parentId || undefined
        });

        if (response.code === 0) {
          toast.success("菜单项创建成功");
          onSuccess();
        }
      }
    } catch (error) {
      toast.error("操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取当前选择的权限信息
  const selectedPermission = permissions.find(
    p => p.permission_key === form.watch("permission_key")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormControl>
                  <Input placeholder="菜单名称" {...field} />
                </FormControl>
                <FormDescription>菜单项的显示名称</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>路径</FormLabel>
                <FormControl>
                  <Input placeholder="/路径/到/页面" {...field} />
                </FormControl>
                <FormDescription>菜单项的URL路径</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>图标</FormLabel>
                <FormControl>
                  <Input placeholder="图标名称" {...field} />
                </FormControl>
                <FormDescription>图标标识符（可选）</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="permission_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  权限
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Shield className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">
                        选择该菜单项需要的权限。选择权限后，只有拥有该权限的用户才能访问此菜单。
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择权限（可选）" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="flex items-center px-2 pb-1">
                      <Input
                        placeholder="搜索权限..."
                        value={searchTerm}
                        onChange={e => handlePermissionSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <SelectItem value="ALL">无权限要求 (公开访问)</SelectItem>
                    {filteredPermissions.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground text-sm">
                        未找到匹配的权限
                      </div>
                    ) : (
                      filteredPermissions.map(permission => (
                        <SelectItem
                          key={permission.permission_key}
                          value={permission.permission_key}
                        >
                          <div className="flex flex-col">
                            <span>{permission.name}</span>
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {permission.permission_key}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedPermission && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {selectedPermission.name}
                        </Badge>
                        <p className="text-xs text-muted-foreground font-mono">
                          {selectedPermission.permission_key}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">菜单权限</Badge>
                    </div>
                    {selectedPermission.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedPermission.description}
                      </p>
                    )}
                  </div>
                )}

                <FormDescription>查看此菜单所需的权限</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>排序</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormDescription>同级菜单中的显示顺序</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>启用</FormLabel>
                  <FormDescription>切换以启用/禁用此菜单项</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : isEditing ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
