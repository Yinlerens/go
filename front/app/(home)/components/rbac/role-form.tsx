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
import { createRole, updateRole } from "@/app/api/rbac";
import { toast } from "sonner";

// 角色表单验证模式
const roleFormSchema = z.object({
  role_key: z
    .string()
    .min(1, "角色标识是必填的")
    .max(50, "角色标识最多50个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "角色标识只能包含字母、数字和下划线"),
  name: z.string().min(1, "角色名称是必填的").max(100, "角色名称最多100个字符"),
  description: z.string().max(255, "描述最多255个字符").optional()
});

// 角色表单属性
interface RoleFormProps {
  initialData?: {
    role_key: string;
    name: string;
    description?: string;
  };
  isEdit?: boolean;
  onSuccess: () => void;
}

// 角色表单组件
export function RoleForm({ initialData, isEdit = false, onSuccess }: RoleFormProps) {
  // 初始化表单
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role_key: initialData?.role_key || "",
      name: initialData?.name || "",
      description: initialData?.description || ""
    }
  });


  // 表单提交处理
  async function onSubmit(values: z.infer<typeof roleFormSchema>) {
    try {
      if (isEdit) {
        // 更新角色
        const { code } = await updateRole({
          role_key: values.role_key,
          name: values.name,
          description: values.description
        });
        if (code === 0) {
          toast.success("角色已更新");
          onSuccess();
        }
      } else {
        // 创建角色
        const { code } = await createRole({
          role_key: values.role_key,
          name: values.name,
          description: values.description
        });
        if (code === 0) {
          toast.success("角色已创建");
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
          name="role_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色标识</FormLabel>
              <FormControl>
                <Input placeholder="admin" {...field} disabled={isEdit} />
              </FormControl>
              <FormDescription>角色的唯一标识符，只能包含字母、数字和下划线</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色名称</FormLabel>
              <FormControl>
                <Input placeholder="系统管理员" {...field} />
              </FormControl>
              <FormDescription>角色的显示名称</FormDescription>
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
                <Textarea placeholder="拥有系统的所有权限" className="resize-none" {...field} />
              </FormControl>
              <FormDescription>角色的详细描述（可选）</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onSuccess}>
            取消
          </Button>
          <Button type="submit">{isEdit ? "保存更改" : "创建角色"}</Button>
        </div>
      </form>
    </Form>
  );
}
