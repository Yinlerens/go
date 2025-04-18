"use client";

import React, { useState, useEffect, useCallback } from "react"; // 引入 React Hooks
import {
  CheckCircle, // 成功图标
  XCircle, // 失败图标
  Info, // 信息图标
  Calendar, // 日历图标
  User, // 用户图标
  Tag, // 标签图标 (用于资源)
  Filter, // 筛选图标
  RefreshCw, // 刷新图标
  Server, // 服务器图标 (用于服务名)
  Globe, // 地球图标 (用于 IP)
  Terminal, // 终端图标 (用于操作)
  GitBranch, // 分支图标 (用于 EventID/RequestID)
  MousePointer // 指针图标 (用于 UserAgent)
} from "lucide-react"; // 引入图标库
import { format } from "date-fns"; // 引入日期格式化库
import { DateRange } from "react-day-picker"; // 引入日期范围类型

// --- UI 组件导入 ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"; // 表格组件
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"; // 分页组件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"; // 下拉选择组件
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // 弹出框组件
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"; // 悬停卡片组件
import { Badge } from "@/components/ui/badge"; // 徽章组件
import { Button } from "@/components/ui/button"; // 按钮组件
import { Input } from "@/components/ui/input"; // 输入框组件
import { Label } from "@/components/ui/label"; // 标签组件
import { Skeleton } from "@/components/ui/skeleton"; // 加载状态骨架屏组件
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // 日期范围选择器组件

// --- API 导入 (请根据实际路径修改) ---
import {
  listAuditLogs, // 获取审计日志列表 API 函数
  getAuditEventTypes, // 获取事件类型 API 函数
  getAuditServiceNames, // 获取服务名称 API 函数
  ListAuditLogsRequest, // API 请求类型接口
  AuditLog // 审计日志数据模型接口
} from "@/app/api/audit"; // 调整为你的 audit.ts 文件路径

// --- 筛选条件状态接口 ---
interface AuditFilters {
  user_id?: string; // 用户 ID
  username?: string; // 用户名
  event_type?: string; // 事件类型
  service_name?: string; // 服务名称
  result?: string; // 操作结果 (success/failure)
  resource_type?: string; // 资源类型
  resource_id?: string; // 资源 ID
  client_ip?: string; // 客户端 IP
  // start_time 和 end_time 通过 dateRange 状态管理
}

// --- 组件定义 ---
export default function AuditLogsPage() {
  // --- 状态管理 ---
  const [loading, setLoading] = useState(true); // 加载状态
  const [logs, setLogs] = useState<AuditLog[]>([]); // 日志数据列表
  const [totalLogs, setTotalLogs] = useState(0); // 日志总条数
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [filterOpen, setFilterOpen] = useState(false); // 筛选弹出框是否打开
  const [filters, setFilters] = useState<AuditFilters>({}); // 当前应用的筛选条件
  const [dateRange, setDateRange] = useState<DateRange | undefined>(); // 日期范围筛选
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]); // 可选的事件类型 (用于筛选)
  const [availableServiceNames, setAvailableServiceNames] = useState<string[]>([]); // 可选的服务名称 (用于筛选)

  const pageSize = 10; // 每页显示的日志条数

  // ---副作用 Hook: 组件加载时获取动态筛选选项 ---
  useEffect(() => {
    // 定义异步函数获取筛选选项
    const fetchFilterOptions = async () => {
      try {
        // 并发请求事件类型和服务名称
        const [eventTypesRes, serviceNamesRes] = await Promise.all([
          getAuditEventTypes(),
          getAuditServiceNames()
        ]);
        // 更新状态 (假设 API 返回的数据结构中包含 data 字段)
        // 注意：这里假设你的 API 函数返回的结构是 { data: { event_types: [], ... } }
        // 如果你的 API 函数直接返回 { event_types: [], ... }，需要去掉 .data
        setAvailableEventTypes(eventTypesRes.data.event_types || []);
        setAvailableServiceNames(serviceNamesRes.data.service_names || []);
      } catch (error) {
        console.error("获取筛选选项失败:", error);
        // 在这里可以添加用户提示，例如使用 Toast 组件
      }
    };
    // 执行获取函数
    fetchFilterOptions();
  }, []); // 空依赖数组表示仅在组件首次挂载时执行

  // ---副作用 Hook: 获取审计日志数据 ---
  // 使用 useCallback 包装 fetchAuditLogs 以便在依赖项中使用稳定引用
  const fetchAuditLogs = useCallback(
    async (pageToFetch = currentPage) => {
      setLoading(true); // 开始加载，设置加载状态
      try {
        // 构建 API 请求体
        const requestPayload: ListAuditLogsRequest = {
          page: pageToFetch, // 请求的页码
          page_size: pageSize, // 每页数量
          // 从 filters 状态中获取筛选条件，空字符串转为 undefined
          user_id: filters.user_id || undefined,
          username: filters.username || undefined,
          event_type: filters.event_type || undefined,
          service_name: filters.service_name || undefined,
          result: filters.result || undefined,
          resource_type: filters.resource_type || undefined,
          resource_id: filters.resource_id || undefined,
          client_ip: filters.client_ip || undefined
        };

        // 处理日期范围筛选条件
        if (dateRange?.from) {
          requestPayload.start_time = dateRange.from.toISOString(); // 起始时间转为 ISO 格式
        }
        if (dateRange?.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999); // 包含结束日期的最后一毫秒
          requestPayload.end_time = endDate.toISOString(); // 结束时间转为 ISO 格式
        }

        // 调用 API 函数获取数据
        // 注意：这里假设你的 listAuditLogs 直接返回包含 list 和 total 的对象
        // 如果它返回 { data: { list, total } }，你需要解构 data: const { list, total } = await listAuditLogs(requestPayload);
        const {data:response} = await listAuditLogs(requestPayload);

        // 更新组件状态
        setLogs(response.list || []); // 设置日志列表数据，处理可能为 null 或 undefined 的情况
        setTotalLogs(response.total || 0); // 设置日志总数
      } catch (error) {
        console.error("获取审计日志失败:", error);
        // 发生错误时，清空数据并给出提示
        setLogs([]);
        setTotalLogs(0);
        // 这里可以添加用户提示，例如 Toast
      } finally {
        setLoading(false); // 加载结束，取消加载状态
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [currentPage, filters, dateRange, pageSize]
  ); // 依赖项数组，当这些值变化时，可以重新创建 fetchAuditLogs 函数

  // --- 副作用 Hook: 监控依赖变化并自动获取数据 ---
  useEffect(() => {
    fetchAuditLogs(currentPage);
  }, [fetchAuditLogs, currentPage]); // 当 fetchAuditLogs (及其依赖) 或 currentPage 变化时，重新获取数据

  // --- 筛选条件处理函数 ---
  // 处理筛选输入框/选择框的变化
  const handleFilterChange = (key: keyof AuditFilters, value: string | undefined) => {
    // 更新 filters 状态，将空值或 "ALL" 转为 undefined
    setFilters(prev => ({ ...prev, [key]: value === "ALL" || !value ? undefined : value }));
  };

  // 应用筛选按钮点击事件
  const applyFilters = () => {
    setCurrentPage(1); // 应用新筛选时，回到第一页
    fetchAuditLogs(1); // 立即使用新筛选条件获取第一页数据
    setFilterOpen(false); // 关闭筛选弹出框
  };

  // 重置筛选按钮点击事件
  const resetFilters = () => {
    setFilters({}); // 清空筛选条件对象
    setDateRange(undefined); // 清空日期范围
    if (currentPage === 1) {
      fetchAuditLogs(1); // 如果已在第一页，直接重新获取
    } else {
      setCurrentPage(1); // 否则，设置到第一页（会触发 useEffect 重新获取）
    }
    setFilterOpen(false); // 关闭筛选弹出框
  };

  // --- 刷新按钮处理函数 ---
  const handleRefresh = () => {
    fetchAuditLogs(currentPage); // 重新获取当前页的数据
  };

  // --- 日期时间格式化辅助函数 ---
  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return "-"; // 处理空值
    try {
      // 假设后端返回的是 UTC 时间字符串 (带 'Z' 或时区偏移)
      const date = new Date(dateString);
      // 使用 date-fns 格式化为本地时区的 "年-月-日 时:分:秒" 格式
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch (e) {
      console.error("日期格式化错误:", dateString, e);
      return dateString; // 格式化失败则返回原始字符串
    }
  };

  // --- 分页逻辑 ---
  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  // 处理页码改变事件
  const handlePageChange = (newPage: number) => {
    // 验证新页码是否在有效范围内
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // 更新当前页码状态 (会触发 useEffect 重新获取数据)
    }
  };

  // --- JSX 渲染 ---
  return (
    <div className="space-y-6 p-4 md:p-6">
      {" "}
      {/* 页面容器，增加内边距 */}
      {/* --- 页面标题和操作按钮区域 --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-lg font-medium">审计日志记录</h3> {/* 页面标题 */}
        <div className="flex space-x-2">
          {" "}
          {/* 操作按钮组 */}
          {/* --- 筛选按钮与弹出框 --- */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" /> {/* 筛选图标 */}
                筛选
                {/* 显示当前应用的筛选条件数量 (不包括日期) */}
                {Object.values(filters).filter(v => v).length > 0 || dateRange?.from ? (
                  <Badge variant="secondary" className="ml-1">
                    {/* 计算有效筛选条件的数量 (非空值) + 日期范围算一个 */}
                    {Object.values(filters).filter(v => v).length + (dateRange?.from ? 1 : 0)}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 max-h-[80vh] overflow-y-auto">
              {" "}
              {/* 筛选内容区域，限制最大高度并允许滚动 */}
              <div className="space-y-4">
                <h4 className="font-medium">筛选条件</h4>

                {/* 日期范围选择 */}
                <div className="space-y-2">
                  <Label>日期范围</Label>
                  <DatePickerWithRange
                    // date={dateRange} // 绑定日期范围状态
                    // onDateChange={setDateRange} // 设置日期范围的回调函数
                    className="w-full" // 让选择器宽度适应容器
                  />
                </div>

                {/* 事件类型选择 */}
                <div className="space-y-2">
                  <Label htmlFor="event_type">事件类型</Label>
                  <Select
                    value={filters.event_type || ""} // 绑定状态值
                    onValueChange={value => handleFilterChange("event_type", value)} // 处理选择变化
                  >
                    <SelectTrigger id="event_type">
                      <SelectValue placeholder="所有事件类型" /> {/* 默认提示 */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有事件类型</SelectItem> {/* “全部”选项 */}
                      {/* 动态渲染从 API 获取的事件类型 */}
                      {availableEventTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type} {/* 可以考虑用函数转换成更友好的名称 */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 服务名称选择 */}
                <div className="space-y-2">
                  <Label htmlFor="service_name">服务名称</Label>
                  <Select
                    value={filters.service_name || ""}
                    onValueChange={value => handleFilterChange("service_name", value)}
                  >
                    <SelectTrigger id="service_name">
                      <SelectValue placeholder="所有服务" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有服务</SelectItem>
                      {availableServiceNames.map(name => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 操作结果选择 */}
                <div className="space-y-2">
                  <Label htmlFor="result">操作结果</Label>
                  <Select
                    value={filters.result || ""}
                    onValueChange={value => handleFilterChange("result", value)}
                  >
                    <SelectTrigger id="result">
                      <SelectValue placeholder="所有结果" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有结果</SelectItem>
                      <SelectItem value="success">成功</SelectItem>
                      <SelectItem value="failure">失败</SelectItem>
                      {/* 如果有其他结果类型，可以在此添加 */}
                    </SelectContent>
                  </Select>
                </div>

                {/* 资源类型输入 */}
                <div className="space-y-2">
                  <Label htmlFor="resource_type">资源类型</Label>
                  <Input
                    id="resource_type"
                    placeholder="例如: ROLE, USER"
                    value={filters.resource_type || ""}
                    onChange={e => handleFilterChange("resource_type", e.target.value)}
                  />
                </div>

                {/* 资源 ID 输入 */}
                <div className="space-y-2">
                  <Label htmlFor="resource_id">资源 ID</Label>
                  <Input
                    id="resource_id"
                    placeholder="资源的唯一标识符"
                    value={filters.resource_id || ""}
                    onChange={e => handleFilterChange("resource_id", e.target.value)}
                  />
                </div>

                {/* 用户 ID 输入 */}
                <div className="space-y-2">
                  <Label htmlFor="user_id">用户 ID</Label>
                  <Input
                    id="user_id"
                    placeholder="操作用户的 ID"
                    value={filters.user_id || ""}
                    onChange={e => handleFilterChange("user_id", e.target.value)}
                  />
                </div>

                {/* 用户名输入 */}
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    placeholder="操作用户的名称"
                    value={filters.username || ""}
                    onChange={e => handleFilterChange("username", e.target.value)}
                  />
                </div>

                {/* 客户端 IP 输入 */}
                <div className="space-y-2">
                  <Label htmlFor="client_ip">客户端 IP</Label>
                  <Input
                    id="client_ip"
                    placeholder="来源 IP 地址"
                    value={filters.client_ip || ""}
                    onChange={e => handleFilterChange("client_ip", e.target.value)}
                  />
                </div>

                {/* 筛选操作按钮 */}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={resetFilters}>
                    {" "}
                    {/* 重置按钮 */}
                    重置
                  </Button>
                  <Button onClick={applyFilters}>
                    {" "}
                    {/* 应用筛选按钮 */}
                    应用筛选
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* --- 刷新按钮 --- */}
          <Button
            variant="ghost" // 透明背景按钮
            size="icon" // 图标按钮尺寸
            onClick={handleRefresh} // 点击时刷新数据
            title="刷新" // 鼠标悬停提示
            disabled={loading} // 加载时禁用
          >
            {/* 刷新图标，加载时旋转 */}
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      {/* --- 审计日志表格 --- */}
      <div className="rounded-md border">
        {" "}
        {/* 表格外边框和圆角 */}
        <Table>
          {/* --- 表头 --- */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">时间</TableHead>
              <TableHead className="min-w-[180px]">事件 / 操作</TableHead>
              <TableHead className="min-w-[180px]">操作者 / IP</TableHead>
              <TableHead className="min-w-[180px]">服务 / 请求</TableHead>
              <TableHead className="min-w-[180px]">目标资源</TableHead>
              <TableHead className="w-[80px]">结果</TableHead>
              <TableHead className="w-[80px]">详情</TableHead>
            </TableRow>
          </TableHeader>
          {/* --- 表格内容 --- */}
          <TableBody>
            {loading ? (
              // --- 加载中的骨架屏 ---
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              // --- 无数据提示 ---
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  没有找到匹配的审计日志记录
                </TableCell>
              </TableRow>
            ) : (
              // --- 渲染日志数据行 ---
              logs.map(log => (
                <TableRow key={log.id}>
                  {/* 时间列 */}
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{formatDateTime(log.timestamp)}</span>
                    </div>
                  </TableCell>

                  {/* 事件 / 操作列 */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="whitespace-nowrap w-fit">
                        {log.event_type}
                      </Badge>
                      {log.operation && ( // 如果存在具体操作，显示它
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Terminal className="h-3 w-3 shrink-0" />
                          <span>{log.operation}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* 操作者 / IP 列 */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {log.user_id || log.username ? ( // 优先显示用户名
                        <div className="flex items-center gap-1 font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate" title={log.username || log.user_id}>
                            {log.username || log.user_id}
                          </span>
                        </div>
                      ) : (
                        // 没有用户信息时显示占位符
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                      {log.client_ip && ( // 如果有客户端 IP，显示它
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span>{log.client_ip}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* 服务 / 请求 列 */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {log.service_name ? ( // 显示服务名称
                        <div className="flex items-center gap-1 text-xs">
                          <Server className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{log.service_name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                      {log.request_path && ( // 显示请求方法和路径
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <span className="font-semibold">{log.request_method}</span>
                          <span className="truncate" title={log.request_path}>
                            {log.request_path}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* 目标资源列 */}
                  <TableCell>
                    { log.resource_id ? ( // 如果有资源信息
                      <div className="flex flex-col gap-1">
                        {log.resource_id && ( // 显示资源 ID
                          <div className="flex items-center gap-1 font-medium">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate" title={log.resource_id}>
                              {log.resource_id}
                            </span>
                          </div>
                        )}
                        {log.resource_type && ( // 显示资源类型
                          <span className="text-xs text-muted-foreground pl-5">
                            {" "}
                            {/* Slight indent */}
                            {log.resource_type}
                          </span>
                        )}
                      </div>
                    ) : (
                      // 没有资源信息时显示占位符
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>

                  {/* 结果列 */}
                  <TableCell>
                    {log.result?.toLowerCase() === "success" ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        {" "}
                        {/* 成功徽章 */}
                        <CheckCircle className="h-3.5 w-3.5" />
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        {" "}
                        {/* 失败徽章 */}
                        <XCircle className="h-3.5 w-3.5" />
                        失败
                      </Badge>
                    )}
                  </TableCell>

                  {/* 详情列 */}
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {" "}
                          {/* 图标按钮作为触发器 */}
                          <Info className="h-4 w-4" /> {/* 信息图标 */}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 max-h-[400px] overflow-y-auto">
                        {" "}
                        {/* 悬停卡片内容，限制高度并允许滚动 */}
                        <div className="space-y-3">
                          {" "}
                          {/* 内部元素间距 */}
                          <h4 className="font-semibold text-center mb-2">操作详情</h4>
                          {/* --- 基本信息 --- */}
                          <div className="text-xs space-y-1 border-b pb-2">
                            <p className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                              <strong>Event ID:</strong>
                              <span className="font-mono truncate" title={log.event_id}>
                                {log.event_id}
                              </span>
                            </p>
                            {log.request_id && (
                              <p className="flex items-center gap-1">
                                <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                                <strong>Request ID:</strong>
                                <span className="font-mono truncate" title={log.request_id}>
                                  {log.request_id}
                                </span>
                              </p>
                            )}
                            {log.operation && (
                              <p className="flex items-center gap-1">
                                <Terminal className="h-3 w-3 text-muted-foreground shrink-0" />
                                <strong>Operation:</strong> {log.operation}
                              </p>
                            )}
                            {log.client_ip && (
                              <p className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                                <strong>Client IP:</strong> {log.client_ip}
                              </p>
                            )}
                            {log.request_path && (
                              <p className="flex items-center gap-1">
                                {/* Icon could be Route or similar */}
                                <strong>Path:</strong>
                                <span className="font-mono">
                                  {log.request_method} {log.request_path}
                                </span>
                              </p>
                            )}
                          </div>
                          {/* --- 附加数据 (Details JSON) --- */}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="pt-1">
                              <h5 className="font-semibold mb-1">附加数据</h5>
                              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[150px]">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          {/* --- 错误信息 --- */}
                          {log.error_message && (
                            <div className="pt-1">
                              <h5 className="font-semibold text-destructive mb-1">错误信息</h5>
                              <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {log.error_message}
                              </p>
                            </div>
                          )}
                          {/* --- User Agent --- */}
                          {log.user_agent && (
                            <div className="pt-1 border-t mt-2">
                              <h5 className="font-semibold my-1">User Agent</h5>
                              <p className="text-xs text-muted-foreground break-all flex items-start gap-1">
                                <MousePointer className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                          {/* --- 无附加信息时的提示 --- */}
                          {(!log.details || Object.keys(log.details).length === 0) &&
                            !log.error_message && (
                              <p className="text-xs text-muted-foreground pt-2 text-center">
                                无附加详情或错误信息
                              </p>
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
      {/* --- 分页控制 --- */}
      {totalPages > 1 &&
        !loading && ( // 仅在总页数大于1且不处于加载状态时显示分页
          <Pagination>
            <PaginationContent>
              {/* 上一页按钮 */}
              <PaginationItem>
                <PaginationPrevious
                  href="#" // 使用 # 防止页面跳转，事件通过 onClick 处理
                  onClick={e => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }} // 点击处理函数
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""} // 第一页时禁用
                  aria-disabled={currentPage <= 1} // 无障碍属性
                />
              </PaginationItem>

              {/* 当前页/总页数 显示 (简化版) */}
              <PaginationItem>
                <PaginationLink isActive>
                  {" "}
                  {/* 使用 isActive 样式 */}
                  {currentPage} / {totalPages}
                </PaginationLink>
              </PaginationItem>
              {/* 可以根据需要实现更复杂的页码显示逻辑 */}

              {/* 下一页按钮 */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""} // 最后一页时禁用
                  aria-disabled={currentPage >= totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
    </div>
  );
}
