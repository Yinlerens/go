"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Info, Calendar, User, Tag, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { listAuditLogs } from "@/app/api/rbac";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

// 审计日志项类型
interface AuditLog {
  id: number;
  timestamp: string;
  actor_id: string;
  actor_type: string;
  action: string;
  target_type?: string;
  target_key?: string;
  details?: any;
  status: string;
  error_message?: string;
}

// 过滤器类型
interface AuditFilters {
  actor_id?: string;
  actor_type?: string;
  action?: string;
  target_type?: string;
  target_key?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}
export default function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const pageSize = 10;

  // 操作类型列表
  const actionTypes = [
    "ROLE_CREATE",
    "ROLE_UPDATE",
    "ROLE_DELETE",
    "PERMISSION_CREATE",
    "PERMISSION_UPDATE",
    "PERMISSION_DELETE",
    "ASSIGN_USER_ROLE",
    "UNASSIGN_USER_ROLE",
    "ASSIGN_ROLE_PERMISSION",
    "UNASSIGN_ROLE_PERMISSION"
  ];

  // 目标类型列表
  const targetTypes = ["ROLE", "PERMISSION", "USER_ROLE", "ROLE_PERMISSION"];
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const queryParams = {
        page: currentPage,
        page_size: pageSize,
        filters: { ...filters }
      };

      // 添加日期范围
      if (dateRange?.from) {
        queryParams.filters.start_time = dateRange.from.toISOString();
      }
      if (dateRange?.to) {
        // 设置为当天的结束时间 (23:59:59)
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        queryParams.filters.end_time = endDate.toISOString();
      }

      const response = await listAuditLogs(queryParams);
      if (response.data) {
        setLogs(response.data.list);
        setTotalLogs(response.data.total);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  // 加载审计日志
  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters, dateRange]);

  // 应用过滤器
  const applyFilters = () => {
    setCurrentPage(1);
    setFilterOpen(false);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({});
    setDateRange(undefined);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  // 获取操作类型的可读名称
  const getActionName = (action: string) => {
    const actionMap: Record<string, string> = {
      ROLE_CREATE: "创建角色",
      ROLE_UPDATE: "更新角色",
      ROLE_DELETE: "删除角色",
      PERMISSION_CREATE: "创建权限",
      PERMISSION_UPDATE: "更新权限",
      PERMISSION_DELETE: "删除权限",
      ASSIGN_USER_ROLE: "分配用户角色",
      UNASSIGN_USER_ROLE: "解除用户角色",
      ASSIGN_ROLE_PERMISSION: "分配角色权限",
      UNASSIGN_ROLE_PERMISSION: "解除角色权限"
    };
    return actionMap[action] || action;
  };

  // 获取目标类型的可读名称
  const getTargetTypeName = (type?: string) => {
    if (!type) return "-";
    const typeMap: Record<string, string> = {
      ROLE: "角色",
      PERMISSION: "权限",
      USER_ROLE: "用户角色",
      ROLE_PERMISSION: "角色权限"
    };
    return typeMap[type] || type;
  };

  // 获取操作者类型的可读名称
  const getActorTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      USER: "用户",
      SERVICE: "服务",
      SYSTEM: "系统"
    };
    return typeMap[type] || type;
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch (e) {
      return dateString;
    }
  };

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">审计日志记录</h3>
        <div className="flex space-x-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                筛选
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">筛选条件</h4>

                <div className="space-y-2">
                  <Label htmlFor="actor_type">操作者类型</Label>
                  <Select
                    value={filters.actor_type || ""}
                    onValueChange={value =>
                      setFilters({ ...filters, actor_type: value || undefined })
                    }
                  >
                    <SelectTrigger id="actor_type">
                      <SelectValue placeholder="所有操作者类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有操作者类型</SelectItem>
                      <SelectItem value="USER">用户</SelectItem>
                      <SelectItem value="SERVICE">服务</SelectItem>
                      <SelectItem value="SYSTEM">系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action">操作类型</Label>
                  <Select
                    value={filters.action || ""}
                    onValueChange={value => setFilters({ ...filters, action: value || undefined })}
                  >
                    <SelectTrigger id="action">
                      <SelectValue placeholder="所有操作类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有操作类型</SelectItem>
                      {actionTypes.map(action => (
                        <SelectItem key={action} value={action}>
                          {getActionName(action)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_type">目标类型</Label>
                  <Select
                    value={filters.target_type || ""}
                    onValueChange={value =>
                      setFilters({ ...filters, target_type: value || undefined })
                    }
                  >
                    <SelectTrigger id="target_type">
                      <SelectValue placeholder="所有目标类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有目标类型</SelectItem>
                      {targetTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {getTargetTypeName(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">操作状态</Label>
                  <Select
                    value={filters.status || ""}
                    onValueChange={value => setFilters({ ...filters, status: value || undefined })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="所有状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有状态</SelectItem>
                      <SelectItem value="SUCCESS">成功</SelectItem>
                      <SelectItem value="FAILURE">失败</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_key">目标标识</Label>
                  <Input
                    id="target_key"
                    placeholder="如：角色key或权限key"
                    value={filters.target_key || ""}
                    onChange={e =>
                      setFilters({ ...filters, target_key: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actor_id">操作者ID</Label>
                  <Input
                    id="actor_id"
                    placeholder="操作者ID"
                    value={filters.actor_id || ""}
                    onChange={e =>
                      setFilters({ ...filters, actor_id: e.target.value || undefined })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>日期范围</Label>
                  <DatePickerWithRange />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={resetFilters}>
                    重置
                  </Button>
                  <Button onClick={applyFilters}>应用筛选</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
             currentPage > 1 ? setCurrentPage(1) : fetchAuditLogs();
            }}
            title="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">时间</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>目标</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[100px]">详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  没有找到匹配的审计日志记录
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDateTime(log.timestamp)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getActionName(log.action)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{log.actor_id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getActorTypeName(log.actor_type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.target_type ? (
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[150px]">
                            {log.target_key}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getTargetTypeName(log.target_type)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.status === "SUCCESS" ? (
                      <Badge className="bg-green-50 text-green-600 border-green-600 hover:bg-green-50">
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="destructive">失败</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">操作详情</h4>
                          {log.details ? (
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px]">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">无详情数据</p>
                          )}
                          {log.error_message && (
                            <div className="pt-2">
                              <h5 className="font-semibold text-destructive">错误信息</h5>
                              <p className="text-sm text-destructive">{log.error_message}</p>
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
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
