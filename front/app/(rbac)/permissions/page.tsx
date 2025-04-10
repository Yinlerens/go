"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { listPermissions, deletePermission } from "@/app/api/rbac";
import { toast } from "sonner";

export default function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [permissionType, setPermissionType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<
    Array<{
      permission_key: string;
      name: string;
      type: string;
      description?: string;
    }>
  >([]);
  const [totalPermissions, setTotalPermissions] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    getListPermissions();
  }, [currentPage, permissionType, pageSize]);
  const getListPermissions = async () => {
    setLoading(true);
    try {
      const response = await listPermissions({
        page: currentPage,
        page_size: pageSize,
        type: permissionType === "ALL" ? undefined : permissionType
      });
      if (response.data) {
        setPermissions(response.data.list);
        setTotalPermissions(response.data.total);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (permissionKey: string) => {
    try {
      const { code } = await deletePermission({ permission_key: permissionKey });
      if (code === 0) {
        currentPage === 1 ? getListPermissions() : setCurrentPage(1);
        toast.success("删除成功");
      }
    } catch (error) {}
  };

  // 筛选权限列表
  const filteredPermissions = searchQuery
    ? permissions.filter(
        permission =>
          permission.permission_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (permission.description &&
            permission.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : permissions;

  const totalPages = Math.ceil(totalPermissions / pageSize);

  // 获取权限类型的展示文本
  const getPermissionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      MENU: "菜单权限",
      BUTTON: "按钮权限",
      API: "接口权限"
    };
    return typeMap[type] || type;
  };

  // 获取权限类型的样式
  const getPermissionTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    const variantMap: Record<string, "default" | "secondary" | "outline"> = {
      MENU: "default",
      BUTTON: "secondary",
      API: "outline"
    };
    return variantMap[type] || "default";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">权限管理</h2>
        <Button asChild>
          <Link href="/permissions/create">
            <Plus className="mr-2 h-4 w-4" />
            创建权限
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="flex-1">
          <Input
            placeholder="搜索权限..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={permissionType}
          onValueChange={value => {
            setPermissionType(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有权限类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">所有权限类型</SelectItem>
            <SelectItem value="MENU">菜单权限</SelectItem>
            <SelectItem value="BUTTON">按钮权限</SelectItem>
            <SelectItem value="API">接口权限</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>权限类型</TableHead>
              <TableHead>权限标识</TableHead>
              <TableHead>权限名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery || permissionType ? "没有找到匹配的权限" : "暂无权限数据"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPermissions.map(permission => (
                <TableRow key={permission.permission_key}>
                  <TableCell>
                    <Badge variant={getPermissionTypeBadgeVariant(permission.type)}>
                      {getPermissionTypeLabel(permission.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{permission.permission_key}</TableCell>
                  <TableCell>{permission.name}</TableCell>
                  <TableCell>{permission.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" asChild title="编辑权限">
                        <Link href={`/permissions/${permission.permission_key}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            title="删除权限"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除权限 "{permission.name}" ({permission.permission_key})
                              吗？此操作不可恢复，并将解除该权限与所有角色的关联。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(permission.permission_key)}
                              className="bg-destructive  hover:bg-destructive/70"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                  }}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
