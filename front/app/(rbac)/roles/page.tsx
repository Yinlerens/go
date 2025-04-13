"use client";

import { useEffect, useState } from "react";
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
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteRole, listRoles } from "@/app/api/rbac";
import { RoleForm } from "@/app/components/rbac/role-form";
import { RolePermissionForm } from "@/app/components/rbac/role-permission-form";

export default function RolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{ role_key: string; name: string; description?: string }[]>(
    []
  );
  const [totalRoles, setTotalRoles] = useState(0);
  const pageSize = 10;

  // 弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{
    role_key: string;
    name: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    fetchRoles();
  }, [currentPage, pageSize]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await listRoles({ page: currentPage, page_size: pageSize });
      if (response.data) {
        setRoles(response.data.list);
        setTotalRoles(response.data.total);
      }
    } catch (error) {
      toast.error("获取角色列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleKey: string) => {
    try {
      await deleteRole({ role_key: roleKey });
      // 重新加载角色列表
      await fetchRoles();
      toast.success("角色已删除");
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("删除角色失败");
    }
  };

  // 编辑角色
  const handleEdit = (role: { role_key: string; name: string; description?: string }) => {
    setSelectedRole(role);
    setShowEditDialog(true);
  };

  // 管理权限
  const handleManagePermissions = (role: {
    role_key: string;
    name: string;
    description?: string;
  }) => {
    setSelectedRole(role);
    setShowPermissionsDialog(true);
  };

  // 确认删除
  const confirmDelete = (role: { role_key: string; name: string; description?: string }) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
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
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建角色
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
                      <Button
                        variant="outline"
                        size="icon"
                        title="编辑角色"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="管理权限"
                        onClick={() => handleManagePermissions(role)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        title="删除角色"
                        onClick={() => confirmDelete(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              // 计算要显示的页码（显示当前页面和周围页面）
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
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

      {/* 创建角色弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建角色</DialogTitle>
            <DialogDescription>添加新角色，并设置基本信息。创建后可以分配权限。</DialogDescription>
          </DialogHeader>
          <RoleForm
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchRoles();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑角色弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>修改角色信息，角色标识不可更改。</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <RoleForm
              initialData={selectedRole}
              isEdit={true}
              onSuccess={() => {
                setShowEditDialog(false);
                fetchRoles();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 管理权限弹窗 */}
      <Dialog
        open={showPermissionsDialog}
        onOpenChange={setShowPermissionsDialog}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>权限管理</DialogTitle>
            <DialogDescription>设置角色权限</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="overflow-y-auto">
              <RolePermissionForm roleKey={selectedRole.role_key} roleName={selectedRole.name} />
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除角色 "{selectedRole?.name}" ({selectedRole?.role_key})
              吗？此操作不可恢复，并将解除该角色与所有用户的关联。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRole && handleDelete(selectedRole.role_key)}
              className="bg-destructive hover:bg-destructive/70"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
