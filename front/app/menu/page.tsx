"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import { FolderTree, Plus, PenSquare, Trash2, FileWarning, Check, X } from "lucide-react";
import { MenuNode } from "./menu";
import { deleteMenuItem, getMenuTree } from "../api/menu";
import { MenuForm } from "../components/menu/menu-form";
import { MenuLogs } from "../components/menu/menu-log";
import { PermissionForm } from "../components/menu/permission-form";

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuNode | null>(null);
  const [editPermission, setEditPermission] = useState<MenuNode | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // 加载菜单数据
  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMenuTree();
      if (response.code === 0) {
        setMenuItems(response.data.items || []);
        setError(null);
      } else {
        setError(response.msg || "加载菜单数据失败");
      }
    } catch (err) {
      setError("加载菜单数据时发生错误");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // 将树结构扁平化以用于表格视图
  const flattenMenuItems = (items: MenuNode[], level = 0): (MenuNode & { level: number })[] => {
    return items.reduce((acc, item) => {
      return [...acc, { ...item, level }, ...flattenMenuItems(item.children || [], level + 1)];
    }, [] as (MenuNode & { level: number })[]);
  };

  const handleEdit = (item: MenuNode) => {
    setEditingMenu(item);
  };

  const handleEditPermission = (item: MenuNode) => {
    setEditPermission(item);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteMenuItem({ id });
      if (response.code === 0) {
        toast.success("菜单项删除成功");
        loadMenuData();
        setShowDeleteDialog(false);
        setMenuToDelete(null);
      }
    } catch (err) {}
  };

  const confirmDelete = (id: string) => {
    setShowAddDialog(false);
    setMenuToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleAddNew = (parentId?: string) => {
    setSelectedParentId(parentId || null);
    setShowAddDialog(true);
  };

  const renderIndent = (level: number) => {
    return Array(level)
      .fill(0)
      .map((_, i) => <span key={i} className="inline-block w-6"></span>);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">控制面板</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/menu">菜单管理</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">菜单管理</h1>
        <p className="text-muted-foreground">创建、编辑和管理菜单项</p>
      </div>

      <Tabs defaultValue="menu-items">
        <TabsList>
          <TabsTrigger value="menu-items">菜单项</TabsTrigger>
          <TabsTrigger value="menu-logs">变更日志</TabsTrigger>
        </TabsList>
        <TabsContent value="menu-items" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              <h2 className="text-xl font-semibold">菜单结构</h2>
            </div>
            <Button onClick={() => handleAddNew()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> 添加根项
            </Button>
          </div>

          {error && (
            <div className="flex items-center bg-destructive/15 text-destructive rounded-md p-4 mb-4">
              <FileWarning className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] text-center">名称</TableHead>
                  <TableHead className="text-center">路径</TableHead>
                  <TableHead className="text-center">权限键</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">排序</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      正在加载菜单项...
                    </TableCell>
                  </TableRow>
                ) : flattenMenuItems(menuItems).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      未找到菜单项。创建您的第一个菜单项。
                    </TableCell>
                  </TableRow>
                ) : (
                  flattenMenuItems(menuItems).map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                          {renderIndent(item.level)}
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.path}</TableCell>
                      <TableCell className="text-center">
                        {item.permission_key ? (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.permission_key}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">无需权限</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.is_enabled ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 mx-auto"
                          >
                            <Check className="h-3 w-3" /> 已启用
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 mx-auto"
                          >
                            <X className="h-3 w-3" /> 已禁用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.order}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddNew(item.id)}
                            title="添加子项"
                          >
                            <Plus className="h-4 w-4" />
                            添加子项
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="编辑菜单"
                          >
                            <PenSquare className="h-4 w-4" />
                            编辑菜单
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPermission(item)}
                            title="更新权限"
                          >
                            <Check className="h-4 w-4" />
                            更新权限
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(item.id)}
                            title="删除"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="menu-logs">
          <MenuLogs />
        </TabsContent>
      </Tabs>

      {/* 编辑菜单对话框 */}
      <Dialog open={editingMenu !== null} onOpenChange={open => !open && setEditingMenu(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑菜单项</DialogTitle>
            <DialogDescription>更新此菜单项的详细信息。</DialogDescription>
          </DialogHeader>
          {editingMenu && (
            <MenuForm
              item={editingMenu}
              onSuccess={() => {
                setEditingMenu(null);
                loadMenuData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 添加菜单对话框 */}
      <Dialog open={showAddDialog} onOpenChange={open => !open && setShowAddDialog(false)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>添加新菜单项</DialogTitle>
            <DialogDescription>
              {selectedParentId ? "创建新的子菜单项" : "创建新的根菜单项"}
            </DialogDescription>
          </DialogHeader>
          <MenuForm
            parentId={selectedParentId}
            onSuccess={() => {
              setShowAddDialog(false);
              loadMenuData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑权限对话框 */}
      <Dialog
        open={editPermission !== null}
        onOpenChange={open => !open && setEditPermission(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>更新菜单权限</DialogTitle>
            <DialogDescription>设置或更改此菜单项所需的权限。</DialogDescription>
          </DialogHeader>
          {editPermission && (
            <PermissionForm
              item={editPermission}
              onSuccess={() => {
                setEditPermission(null);
                loadMenuData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>您确定要删除吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除菜单项并将其从我们的服务器中移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/70"
              onClick={() => menuToDelete && handleDelete(menuToDelete)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
