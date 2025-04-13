"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Plus, PenSquare, Check, Trash2, X } from "lucide-react";
import React from "react";
import { MenuNode } from "@/app/menu/menu";

interface MenuTreeTableProps {
  menuItems: MenuNode[];
  onAddChild: (parentId: string) => void;
  onEdit: (item: MenuNode) => void;
  onDelete: (id: string) => void;
}

export function MenuTreeTable({
  menuItems,
  onAddChild,
  onEdit,
  onDelete
}: MenuTreeTableProps) {
  // 存储展开状态的状态
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 切换节点的展开/折叠状态
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 检查节点是否有子节点
  const hasChildren = (item: MenuNode) => item.children && item.children.length > 0;

  // 递归渲染菜单项
  const renderMenuItem = (item: MenuNode, level = 0, isLastChild = false): React.ReactNode => {
    const isExpanded = expandedItems[item.id] ?? true; // 默认展开
    const hasChildNodes = hasChildren(item);

    return (
      <React.Fragment key={item.id}>
        <TableRow className={level > 0 ? "bg-muted/30" : ""}>
          <TableCell className="font-medium">
            <div className="flex items-center">
              {/* 渲染树形缩进和连接线 */}
              {level > 0 &&
                Array(level)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={`indent-${item.id}-${i}`}
                      className={`w-6 h-6 relative ${
                        i < level - 1 ? "border-l border-muted-foreground/20" : ""
                      }`}
                    ></div>
                  ))}

              {/* 展开/折叠按钮或占位 */}
              {hasChildNodes ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 mr-1"
                  onClick={() => toggleExpand(item.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                level > 0 && (
                  <div className="w-6 h-6 relative">
                    <div className="absolute top-1/2 left-0 h-px w-3 bg-muted-foreground/20"></div>
                  </div>
                )
              )}

              {/* 菜单名称 */}
              <span className={`${hasChildNodes ? "font-semibold" : ""}`}>{item.name}</span>
            </div>
          </TableCell>
          <TableCell className="text-center">{item.path}</TableCell>
          <TableCell className="text-center">
            {item.permission_key ? (
              <span className="text-xs text-muted-foreground font-mono">{item.permission_key}</span>
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
                onClick={() => onAddChild(item.id)}
                title="添加子项"
              >
                <Plus className="h-4 w-4" />
                添加子项
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)} title="编辑菜单">
                <PenSquare className="h-4 w-4" />
                编辑菜单
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                title="删除"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {/* 递归渲染子节点 */}
        {hasChildNodes && isExpanded && (
          <React.Fragment>
            {item.children.map((child, idx) =>
              renderMenuItem(child, level + 1, idx === item.children.length - 1)
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">名称</TableHead>
            <TableHead className="text-center">路径</TableHead>
            <TableHead className="text-center">权限键</TableHead>
            <TableHead className="text-center">状态</TableHead>
            <TableHead className="text-center">排序</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menuItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                未找到菜单项。创建您的第一个菜单项。
              </TableCell>
            </TableRow>
          ) : (
            menuItems.map((item, index) => renderMenuItem(item, 0, index === menuItems.length - 1))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
