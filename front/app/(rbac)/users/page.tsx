"use client";

import { useEffect, useState } from "react";
import { Shield, UserIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { listUsers, User } from "@/app/api/auth";
import { getUsersRoles, Role } from "@/app/api/rbac";
import { UserRoleForm } from "@/app/components/rbac/user-role-form";
import { toast } from "sonner";

type UserWithRole = User & { roles: Role[] };

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const pageSize = 10;
  const [totalUsers, setTotalUsers] = useState(0);

  // 弹窗状态
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const totalPages = Math.ceil(totalUsers / pageSize);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { code, data } = await listUsers({
        page: currentPage,
        page_size: pageSize,
        username: searchQuery
      });
      if (code === 0) {
        setTotalUsers(data.total);
        const userList = data.list;
        const userIds = userList.map(user => user.user_id);
        const { code: rolesCode, data: roleData } = await getUsersRoles({ user_ids: userIds });
        const usersWithRoles = userList.map(user => ({
          ...user,
          roles: rolesCode === 0 ? roleData.user_roles[user.user_id as any] || [] : []
        }));
        setUsers(usersWithRoles as UserWithRole[]);
      }
    } catch (error) {
      toast.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchQuery]);

  // 处理管理角色按钮点击
  const handleManageRoles = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowRolesDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">用户角色管理</h2>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="搜索用户或角色..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>当前角色</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery ? "没有找到匹配的用户" : "暂无用户数据"}
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "outline" : "secondary"}
                      className={user.status === "active" ? "text-green-600 border-green-600" : ""}
                    >
                      {user.status === "active" ? "活跃" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map(role => (
                          <Badge key={role.role_key} variant="secondary">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">无角色</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => handleManageRoles(user)}
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" />
                      管理角色
                    </Button>
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

      {/* 用户角色管理弹窗 */}
      <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>角色管理: {selectedUser?.username}</DialogTitle>
            <DialogDescription>为此用户分配或移除角色</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="overflow-y-auto flex-1">
              <UserRoleForm
                userId={selectedUser.user_id}
                username={selectedUser.username}
                onSuccess={() => {
                  setShowRolesDialog(false);
                  fetchUsers();
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
