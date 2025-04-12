"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { updateMenuItem, createMenuItem } from "@/app/api/menu";
import { MenuNode } from "@/app/menu/menu";

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
  const isEditing = !!item;

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
    } finally {
      setIsSubmitting(false);
    }
  };
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
                <FormLabel>权限标识</FormLabel>
                <FormControl>
                  <Input placeholder="menu:section:action" {...field} />
                </FormControl>
                <FormDescription>查看此菜单所需的RBAC权限标识</FormDescription>
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
