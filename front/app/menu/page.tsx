"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FolderTree, Plus, FileWarning } from "lucide-react";
import { MenuNode } from "./menu";
import { deleteMenuItem, getMenuTree } from "../api/menu";
import { MenuForm } from "../components/menu/menu-form";
import { MenuLogs } from "../components/menu/menu-log";
import { MenuTreeTable } from "../components/menu/menu-tree";
// 移除不再需要的PermissionForm导入
// 导入新创建的树形菜单表格组件

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuNode | null>(null);
  // 移除editPermission状态
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

  const handleEdit = (item: MenuNode) => {
    setEditingMenu(item);
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

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <MenuTreeTable
              menuItems={menuItems}
              onAddChild={handleAddNew}
              onEdit={handleEdit}
              onDelete={confirmDelete}
            />
          )}
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
          {/* 使用优化后的MenuForm组件，已包含权限选择功能 */}
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

      {/* 已移除编辑权限对话框 */}

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
