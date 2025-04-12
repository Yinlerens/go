"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  SquareChevronRight,
  Shield,
  Calendar,
  User,
  Plus,
  Edit,
  Trash,
  Clock,
  FileText,
  X
} from "lucide-react";
import { listMenuLogs } from "@/app/api/menu";

// 新增对话框组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

// 菜单日志类型
interface MenuLog {
  id: number;
  menu_id: string;
  action: string;
  operator_id: string;
  operator_type: string;
  before_change: Record<string, any> | null;
  after_change: Record<string, any> | null;
  created_at: string;
}

export function MenuLogs() {
  const [logs, setLogs] = useState<MenuLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<{
    menu_id?: string;
    action?: string;
    operator_id?: string;
  }>({});

  // 新增状态用于控制对话框和当前选中的日志
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MenuLog | null>(null);

  // 加载日志数据
  const loadLogs = async () => {
    try {
      setLoading(true);

      const response = await listMenuLogs({
        page,
        page_size: pageSize,
        filters
      });

      if (response.code === 0) {
        setLogs(response.data.list);
        setTotalItems(response.data.total);
        setError(null);
      } else {
        setError(response.msg || "加载菜单日志失败");
      }
    } catch (err) {
      setError("加载菜单日志时发生错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, filters]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 获取操作图标
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "UPDATE":
        return <Edit className="h-4 w-4 text-amber-500" />;
      case "DELETE":
        return <Trash className="h-4 w-4 text-red-500" />;
      case "UPDATE_PERMISSION":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // 获取操作名称
  const getActionName = (action: string) => {
    switch (action) {
      case "CREATE":
        return "创建";
      case "UPDATE":
        return "更新";
      case "DELETE":
        return "删除";
      case "UPDATE_PERMISSION":
        return "更新权限";
      default:
        return action;
    }
  };

  // 获取总页数
  const totalPages = Math.ceil(totalItems / pageSize);

  // 处理筛选条件变更
  const handleFilterChange = (key: string, value: string) => {
    if (value === "") {
      const newFilters = { ...filters };
      delete newFilters[key as keyof typeof filters];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
    setPage(1); // 筛选条件变更时重置为第一页
  };

  // 处理查看变更点击事件
  const handleViewChanges = (log: MenuLog) => {
    setSelectedLog(log);
    setIsChangeDialogOpen(true);
  };

  // 渲染字段变更对比
  const renderFieldComparison = (
    before: Record<string, any> | null,
    after: Record<string, any> | null
  ) => {
    // 如果是创建操作，只显示创建后的字段
    if (!before && after) {
      return (
        <div className="bg-green-50 p-3 rounded-md">
          <h4 className="font-medium text-green-700 mb-2">创建的菜单信息</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-80">
            {JSON.stringify(after, null, 2)}
          </pre>
        </div>
      );
    }

    // 如果是删除操作，只显示删除前的字段
    if (before && !after) {
      return (
        <div className="bg-red-50 p-3 rounded-md">
          <h4 className="font-medium text-red-700 mb-2">删除的菜单信息</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-80">
            {JSON.stringify(before, null, 2)}
          </pre>
        </div>
      );
    }

    // 如果是更新操作，展示字段对比
    if (before && after) {
      // 找出发生变化的字段
      const changedFields: string[] = [];
      const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);

      allFields.forEach(field => {
        const beforeValue = before[field];
        const afterValue = after[field];

        // 检查值是否发生变化
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          changedFields.push(field);
        }
      });

      return (
        <div className="bg-amber-50 p-3 rounded-md">
          <h4 className="font-medium text-amber-700 mb-2">变更的字段 ({changedFields.length})</h4>
          {changedFields.length > 0 ? (
            <div className="space-y-3">
              {changedFields.map(field => (
                <div key={field} className="border rounded-md overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 font-medium text-sm">{field}</div>
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-2 bg-red-50">
                      <div className="text-xs text-red-500 mb-1">修改前</div>
                      <div className="font-mono text-xs break-all">
                        {JSON.stringify(before[field])}
                      </div>
                    </div>
                    <div className="p-2 bg-green-50">
                      <div className="text-xs text-green-500 mb-1">修改后</div>
                      <div className="font-mono text-xs break-all">
                        {JSON.stringify(after[field])}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">没有发现变更</div>
          )}
        </div>
      );
    }

    return <div className="text-sm text-gray-500">无变更信息</div>;
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <Clock className="h-5 w-5 mr-2" />
        <h2 className="text-xl font-semibold">菜单变更日志</h2>
      </div>

      <div className="bg-muted p-4 rounded-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">操作类型</label>
            <Select
              onValueChange={value => handleFilterChange("action", value)}
              value={filters.action || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="按操作类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">所有操作</SelectItem>
                <SelectItem value="CREATE">创建</SelectItem>
                <SelectItem value="UPDATE">更新</SelectItem>
                <SelectItem value="DELETE">删除</SelectItem>
                <SelectItem value="UPDATE_PERMISSION">更新权限</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">菜单ID</label>
            <Input
              placeholder="按菜单ID筛选"
              value={filters.menu_id || ""}
              onChange={e => handleFilterChange("menu_id", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">操作者ID</label>
            <Input
              placeholder="按操作者ID筛选"
              value={filters.operator_id || ""}
              onChange={e => handleFilterChange("operator_id", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({});
              setPage(1);
            }}
          >
            清除筛选
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>菜单ID</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  正在加载日志...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  未找到日志。
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span>{getActionName(log.action)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{log.menu_id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" />
                      <span>{log.operator_id}</span>
                      <span className="text-xs text-muted-foreground">
                        ({log.operator_type === "USER" ? "用户" : "服务"})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleViewChanges(log)}
                    >
                      <SquareChevronRight className="h-4 w-4" />
                      <span>查看变更</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // 计算要显示的页码（显示当前页面和周围页面）
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                    isActive={pageNum === page}
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
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 变更详情对话框 */}
      <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActionIcon(selectedLog.action)}
              <span>
                {selectedLog
                  ? `${getActionName(selectedLog.action)}操作详情 (ID: ${selectedLog.id})`
                  : "变更详情"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" />
                      <span>操作者: {selectedLog.operator_id}</span>
                      <span className="text-xs text-muted-foreground">
                        ({selectedLog.operator_type === "USER" ? "用户" : "服务"})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>操作时间: {formatDate(selectedLog.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span>菜单ID: </span>
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {selectedLog.menu_id}
                    </code>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {selectedLog &&
              renderFieldComparison(selectedLog.before_change, selectedLog.after_change)}
          </div>

          <div className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
