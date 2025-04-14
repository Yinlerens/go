"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createPermission, updatePermission } from "@/app/api/rbac";
import { toast } from "sonner";

// 权限表单验证模式
const permissionFormSchema = z.object({
  permission_key: z
    .string()
    .min(1, "权限标识是必填的")
    .max(100, "权限标识最多100个字符")
    .regex(/^[a-zA-Z0-9_:.:-]+$/, "权限标识只能包含字母、数字、下划线、冒号和连字符"),
  name: z.string().min(1, "权限名称是必填的").max(100, "权限名称最多100个字符"),
  type: z.string().min(1, "权限类型是必填的"),
  description: z.string().max(255, "描述最多255个字符").optional()
});

// 权限表单属性
interface PermissionFormProps {
  initialData?: {
    permission_key: string;
    name: string;
    type: string;
    description?: string;
  };
  isEdit?: boolean;
  onSuccess: () => void;
}

// 权限表单组件
export function PermissionForm({ initialData, isEdit = false, onSuccess }: PermissionFormProps) {
  // 初始化表单
  const form = useForm<z.infer<typeof permissionFormSchema>>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      permission_key: initialData?.permission_key || "",
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || ""
    }
  });

  // 表单提交处理
  async function onSubmit(values: z.infer<typeof permissionFormSchema>) {
    try {
      if (isEdit) {
        // 更新权限
        const { code } = await updatePermission({
          permission_key: values.permission_key,
          name: values.name,
          type: "MENU",
          description: values.description
        });
        if (code === 0) {
          toast.success("权限已更新");
          onSuccess();
        }
      } else {
        // 创建权限
        const { code } = await createPermission({
          permission_key: values.permission_key,
          name: values.name,
          type: "MENU",
          description: values.description
        });
        if (code === 0) {
          toast.success("权限已创建");
          onSuccess();
        }
      }
    } catch (error) {
      toast.error("操作失败");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="permission_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>权限标识</FormLabel>
              <FormControl>
                <Input placeholder="menu:dashboard" {...field} disabled={isEdit} />
              </FormControl>
              <FormDescription>
                权限的唯一标识符，建议使用分层结构（如 menu:user:list）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>权限名称</FormLabel>
              <FormControl>
                <Input placeholder="仪表盘菜单" {...field} />
              </FormControl>
              <FormDescription>权限的显示名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="访问系统仪表盘页面的权限"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>权限的详细描述（可选）</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onSuccess}>
            取消
          </Button>
          <Button type="submit">{isEdit ? "保存更改" : "创建权限"}</Button>
        </div>
      </form>
    </Form>
  );
}
