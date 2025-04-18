"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  User,
  Tag,
  Filter,
  RefreshCw,
  Server,
  Settings
} from "lucide-react"; // Added Server, Settings icons
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// --- UI Component Imports ---
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
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // Ensure this component calls onDateChange(range)

// --- API Imports (Update Path if needed) ---
import {
  listAuditLogs,
  getAuditEventTypes,
  getAuditServiceNames,
  ListAuditLogsRequest, // Import request type if needed elsewhere, otherwise inferred
  AuditLog // Import the AuditLog interface from api definition
} from "@/app/api/audit"; // Adjust path to your audit.ts

// No need to redefine AuditLog interface here if imported

// --- Filters Interface (Aligns with ListAuditLogsRequest) ---
interface AuditFilters {
  user_id?: string;
  username?: string;
  event_type?: string;
  service_name?: string;
  result?: string; // Changed from status
  resource_type?: string; // Changed from target_type
  resource_id?: string; // Changed from target_key
  client_ip?: string;
  // start_time and end_time are handled via dateRange state
}

export default function AuditLogsPage() {
  // Renamed component slightly
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
  const [availableServiceNames, setAvailableServiceNames] = useState<string[]>([]);

  const pageSize = 10; // Or make this configurable

  // --- Fetch dynamic filter options ---
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [eventTypesRes, serviceNamesRes] = await Promise.all([
          getAuditEventTypes(),
          getAuditServiceNames()
        ]);
        setAvailableEventTypes(eventTypesRes.event_types || []);
        setAvailableServiceNames(serviceNamesRes.service_names || []);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
        // Handle error (e.g., show toast)
      }
    };
    fetchFilterOptions();
  }, []);

  // --- Fetch Audit Logs Function ---
  const fetchAuditLogs = async (pageToFetch = currentPage) => {
    setLoading(true);
    try {
      // Build query parameters based on state
      const requestPayload: ListAuditLogsRequest = {
        page: pageToFetch,
        page_size: pageSize,
        // Spread filters, ensuring empty strings become undefined
        user_id: filters.user_id || undefined,
        username: filters.username || undefined,
        event_type: filters.event_type || undefined,
        service_name: filters.service_name || undefined,
        result: filters.result || undefined,
        resource_type: filters.resource_type || undefined,
        resource_id: filters.resource_id || undefined,
        client_ip: filters.client_ip || undefined
      };

      // Add date range from state
      if (dateRange?.from) {
        requestPayload.start_time = dateRange.from.toISOString();
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999); // Include the whole end day
        requestPayload.end_time = endDate.toISOString();
      }

      // Make API call using the imported function
      const response = await listAuditLogs(requestPayload);
      // Assuming the request utility unwraps the { code, msg, data } structure
      setLogs(response.list || []); // Use response directly
      setTotalLogs(response.total || 0); // Use response directly
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      // Handle error appropriately (e.g., show toast notification)
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Effect to fetch logs when dependencies change ---
  useEffect(() => {
    fetchAuditLogs(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Only refetch on page change automatically

  // --- Filter Handlers ---
  const handleFilterChange = (key: keyof AuditFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchAuditLogs(1); // Fetch with new filters immediately
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({});
    setDateRange(undefined);
    if (currentPage === 1) {
      fetchAuditLogs(1); // Refetch if already on page 1
    } else {
      setCurrentPage(1); // Changing page will trigger refetch via useEffect
    }
    setFilterOpen(false);
  };

  // --- Refresh Handler ---
  const handleRefresh = () => {
    fetchAuditLogs(currentPage); // Refetch current page
  };

  // --- Helper Functions (Adapt as needed) ---
  const getResultText = (result?: string) => {
    if (!result) return "-";
    return result.toLowerCase() === "success" ? "成功" : "失败";
  };

  const formatDateTime = (dateString: string) => {
    try {
      // Assuming the incoming string is UTC (ends with 'Z' or has offset)
      const date = new Date(dateString);
      // Format in local time implicitly
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString; // Return original string if formatting fails
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {" "}
      {/* Added padding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className="text-lg font-medium">审计日志记录</h3>
        <div className="flex space-x-2">
          {/* --- Filter Popover --- */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                筛选
                {/* Calculate active filters excluding date range */}
                {Object.values(filters).filter(v => v).length > 0 || dateRange?.from ? (
                  <Badge variant="secondary" className="ml-1">
                    {Object.values(filters).filter(v => v).length + (dateRange?.from ? 1 : 0)}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4 max-h-[80vh] overflow-y-auto">
              {" "}
              {/* Added scroll */}
              <div className="space-y-4">
                <h4 className="font-medium">筛选条件</h4>

                {/* --- Date Range Filter --- */}
                <div className="space-y-2">
                  <Label>日期范围</Label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange} // Pass the setter function
                    className="w-full" // Make picker full width
                  />
                </div>

                {/* --- Event Type Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="event_type">事件类型</Label>
                  <Select
                    value={filters.event_type || ""}
                    onValueChange={value =>
                      handleFilterChange("event_type", value === "ALL" ? undefined : value)
                    }
                  >
                    <SelectTrigger id="event_type">
                      <SelectValue placeholder="所有事件类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有事件类型</SelectItem>
                      {availableEventTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type} {/* Display raw event type or use a mapping function */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* --- Service Name Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="service_name">服务名称</Label>
                  <Select
                    value={filters.service_name || ""}
                    onValueChange={value =>
                      handleFilterChange("service_name", value === "ALL" ? undefined : value)
                    }
                  >
                    <SelectTrigger id="service_name">
                      <SelectValue placeholder="所有服务" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有服务</SelectItem>
                      {availableServiceNames.map(name => (
                        <SelectItem key={name} value={name}>
                          {name} {/* Display raw service name or use a mapping */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* --- Result Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="result">操作结果</Label>
                  <Select
                    value={filters.result || ""}
                    onValueChange={value =>
                      handleFilterChange("result", value === "ALL" ? undefined : value)
                    }
                  >
                    <SelectTrigger id="result">
                      <SelectValue placeholder="所有结果" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有结果</SelectItem>
                      <SelectItem value="success">成功</SelectItem>
                      <SelectItem value="failure">失败</SelectItem>
                      {/* Add other potential result values if needed */}
                    </SelectContent>
                  </Select>
                </div>

                {/* --- Resource Type Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="resource_type">资源类型</Label>
                  <Input
                    id="resource_type"
                    placeholder="例如：ROLE, PERMISSION"
                    value={filters.resource_type || ""}
                    onChange={e => handleFilterChange("resource_type", e.target.value)}
                  />
                </div>

                {/* --- Resource ID Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="resource_id">资源ID</Label>
                  <Input
                    id="resource_id"
                    placeholder="资源的唯一标识"
                    value={filters.resource_id || ""}
                    onChange={e => handleFilterChange("resource_id", e.target.value)}
                  />
                </div>

                {/* --- User ID Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="user_id">用户ID</Label>
                  <Input
                    id="user_id"
                    placeholder="执行操作的用户ID"
                    value={filters.user_id || ""}
                    onChange={e => handleFilterChange("user_id", e.target.value)}
                  />
                </div>

                {/* --- Username Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    placeholder="执行操作的用户名"
                    value={filters.username || ""}
                    onChange={e => handleFilterChange("username", e.target.value)}
                  />
                </div>

                {/* --- Client IP Filter --- */}
                <div className="space-y-2">
                  <Label htmlFor="client_ip">客户端IP</Label>
                  <Input
                    id="client_ip"
                    placeholder="请求来源IP地址"
                    value={filters.client_ip || ""}
                    onChange={e => handleFilterChange("client_ip", e.target.value)}
                  />
                </div>

                {/* --- Filter Actions --- */}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={resetFilters}>
                    重置
                  </Button>
                  <Button onClick={applyFilters}>应用筛选</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* --- Refresh Button --- */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            title="刷新"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      {/* --- Audit Log Table --- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">时间</TableHead>
              <TableHead>事件类型</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>服务</TableHead>
              <TableHead>目标资源</TableHead>
              <TableHead className="w-[80px]">结果</TableHead>
              <TableHead className="w-[100px]">详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton Loading Rows
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
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
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              // No Data Row
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  没有找到匹配的审计日志记录
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              logs.map(log => (
                <TableRow key={log.id}>
                  {/* Timestamp */}
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDateTime(log.timestamp)}</span>
                    </div>
                  </TableCell>
                  {/* Event Type */}
                  <TableCell>
                    <Badge variant="outline">{log.event_type}</Badge>
                  </TableCell>
                  {/* Operator (User) */}
                  <TableCell>
                    {log.user_id || log.username ? (
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[150px]">
                          {log.username || log.user_id}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Service Name */}
                  <TableCell>
                    {log.service_name ? (
                      <div className="flex items-center space-x-1">
                        <Server className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{log.service_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Target Resource */}
                  <TableCell>
                    {log.resource_type || log.resource_id ? (
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[150px]">
                            {log.resource_id}
                          </span>
                        </div>
                        {log.resource_type && (
                          <span className="text-xs text-muted-foreground">{log.resource_type}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Result */}
                  <TableCell>
                    {log.result.toLowerCase() === "success" ? (
                      <Badge variant="default">
                        {" "}
                        {/* Use custom success variant */}
                        {getResultText(log.result)}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{getResultText(log.result)}</Badge>
                    )}
                  </TableCell>
                  {/* Details */}
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 max-h-[400px] overflow-y-auto">
                        {" "}
                        {/* Added scroll */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">操作详情</h4>
                          {/* Display basic info first */}
                          <div className="text-xs space-y-1">
                            <p>
                              <strong>Event ID:</strong> {log.event_id}
                            </p>
                            {log.request_id && (
                              <p>
                                <strong>Request ID:</strong> {log.request_id}
                              </p>
                            )}
                            {log.client_ip && (
                              <p>
                                <strong>Client IP:</strong> {log.client_ip}
                              </p>
                            )}
                            {log.operation && (
                              <p>
                                <strong>Operation:</strong> {log.operation}
                              </p>
                            )}
                            {log.request_path && (
                              <p>
                                <strong>Path:</strong> {log.request_method} {log.request_path}
                              </p>
                            )}
                          </div>
                          {/* Display Details JSON */}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="pt-2">
                              <h5 className="font-semibold">附加数据</h5>
                              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[200px]">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          {/* Display Error Message */}
                          {log.error_message && (
                            <div className="pt-2">
                              <h5 className="font-semibold text-destructive">错误信息</h5>
                              <p className="text-sm text-destructive">{log.error_message}</p>
                            </div>
                          )}
                          {/* Display User Agent */}
                          {log.user_agent && (
                            <div className="pt-2">
                              <h5 className="font-semibold">User Agent</h5>
                              <p className="text-xs text-muted-foreground break-all">
                                {log.user_agent}
                              </p>
                            </div>
                          )}
                          {/* Fallback if no details/error */}
                          {(!log.details || Object.keys(log.details).length === 0) &&
                            !log.error_message && (
                              <p className="text-sm text-muted-foreground pt-2">
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
      {/* --- Pagination Controls --- */}
      {totalPages > 1 && !loading && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                aria-disabled={currentPage <= 1}
              />
            </PaginationItem>
            {/* Simple Pagination Display - Consider more advanced logic for many pages */}
            <PaginationItem>
              <PaginationLink isActive>
                {currentPage} / {totalPages}
              </PaginationLink>
            </PaginationItem>
            {/* You can add more complex page number rendering here if needed */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                aria-disabled={currentPage >= totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
