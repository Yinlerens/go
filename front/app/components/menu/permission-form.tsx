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
import { toast } from "sonner";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { updateMenuPermission } from "@/app/api/menu";
import { MenuNode } from "@/app/menu/menu";

// 表单验证模式
const permissionSchema = z.object({
  permission_key: z.string().optional()
});

type PermissionFormValues = z.infer<typeof permissionSchema>;

interface PermissionFormProps {
  item: MenuNode;
  onSuccess: () => void;
}

export function PermissionForm({ item, onSuccess }: PermissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      permission_key: item.permission_key || ""
    }
  });

  const onSubmit = async (values: PermissionFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await updateMenuPermission({
        id: item.id,
        permission_key: values.permission_key
      });

      if (response.code === 0) {
        toast.success("菜单权限更新成功");
        onSuccess();
      } 
    } catch (error) {
      
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center p-3 mb-4 bg-muted rounded-md">
          <div className="mr-3">
            {item.permission_key ? (
              <ShieldCheck className="h-8 w-8 text-primary" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground">路径: {item.path}</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="permission_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>权限标识</FormLabel>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="menu:section:action" {...field} />
                </FormControl>
              </div>
              <FormDescription>
                输入访问此菜单项所需的RBAC权限标识。留空表示公开访问。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "更新权限"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
