"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { deleteRole, listRoles } from "@/app/api/rbac";

export default function RolesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ role_key: string; name: string; description?: string }[]>(
    []
  );
  const [totalRoles, setTotalRoles] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await listRoles({ page: currentPage, page_size: pageSize });
        if (response.data) {
          setRoles(response.data.list);
          setTotalRoles(response.data.total);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [currentPage, pageSize]);

  const handleDelete = async (roleKey: string) => {
    try {
      await deleteRole({ role_key: roleKey });
      // 重新加载角色列表
      const response = await listRoles({ page: 1, page_size: pageSize });
      if (response.data) {
        setRoles(response.data.list);
        setTotalRoles(response.data.total);
      }
      toast.success("角色已删除");
    } catch (error) {}
  };

  // 筛选角色列表
  const filteredRoles = searchQuery
    ? roles.filter(
        role =>
          role.role_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : roles;

  const totalPages = Math.ceil(totalRoles / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">角色管理</h2>
        <Button asChild>
          <Link href="/roles/create">
            <Plus className="mr-2 h-4 w-4" />
            创建角色
          </Link>
        </Button>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="搜索角色..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色标识</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {searchQuery ? "没有找到匹配的角色" : "暂无角色数据"}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map(role => (
                <TableRow key={role.role_key}>
                  <TableCell className="font-mono">{role.role_key}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" asChild title="编辑角色">
                        <Link href={`/roles/${role.role_key}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild title="管理权限">
                        <Link href={`/roles/${role.role_key}/permissions`}>
                          <Shield className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            title="删除角色"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除角色 "{role.name}" ({role.role_key})
                              吗？此操作不可恢复，并将解除该角色与所有用户的关联。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(role.role_key)}
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
