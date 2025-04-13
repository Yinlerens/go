"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getUserRoles, listRoles, assignRole, unassignRole } from "@/app/api/rbac";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  ChevronRight
} from "lucide-react";

// 角色类型
type Role = {
  role_key: string;
  name: string;
  description?: string;
};

interface UserRoleFormProps {
  userId: string;
  username: string;
}

export function UserRoleForm({ userId, username }: UserRoleFormProps) {
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterAssigned, setFilterAssigned] = useState<"all" | "assigned" | "unassigned">("all");
  const [activeRoleKey, setActiveRoleKey] = useState<string | null>(null);

  // 角色主题色
  const getRoleColor = (index: number) => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-violet-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-amber-500 to-orange-600",
      "from-emerald-500 to-green-600",
      "from-cyan-500 to-blue-600"
    ];
    return colors[index % colors.length];
  };

  // 加载用户角色和所有角色
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取用户当前角色
        const userRolesResponse = await getUserRoles({ user_id: userId });
        if (userRolesResponse.data) {
          setSelectedRoles(userRolesResponse.data.roles.map(r => r.role_key));
        }

        // 获取所有角色
        const allRolesResponse = await listRoles({ page_size: 100 });
        if (allRolesResponse.data) {
          setAllRoles(allRolesResponse.data.list);
          setFilteredRoles(allRolesResponse.data.list);
        }
      } catch (error) {
        toast.error("获取角色数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // 应用过滤和搜索
  useEffect(() => {
    let result = [...allRoles];

    // 应用搜索
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        role =>
          role.name.toLowerCase().includes(query) ||
          role.role_key.toLowerCase().includes(query) ||
          (role.description && role.description.toLowerCase().includes(query))
      );
    }

    // 应用分配过滤
    if (filterAssigned === "assigned") {
      result = result.filter(role => selectedRoles.includes(role.role_key));
    } else if (filterAssigned === "unassigned") {
      result = result.filter(role => !selectedRoles.includes(role.role_key));
    }

    // 应用排序
    result.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredRoles(result);
  }, [allRoles, searchQuery, filterAssigned, sortOrder, selectedRoles]);

  // 切换选择角色
  const toggleRole = async (roleKey: string, checked: boolean) => {
    console.log("%c [ checked ]-118", "font-size:13px; background:pink; color:#bf2c9f;", checked);
    try {
      if (checked) {
        // 添加角色
        const { code } = await assignRole({
          user_id: userId,
          role_keys: [roleKey]
        });
        if (code === 0) {
          setSelectedRoles(prev => [...prev, roleKey]);
          toast.success(`已为用户 ${username} 分配角色`, {
            icon: <UserCheck className="h-4 w-4 text-green-500" />
          });
        }
      } else {
        // 移除角色
        const { code } = await unassignRole({
          user_id: userId,
          role_keys: [roleKey]
        });
        if (code === 0) {
          setSelectedRoles(prev => prev.filter(key => key !== roleKey));
          toast.success(`已解除用户 ${username} 的角色`, {
            icon: <UserCheck className="h-4 w-4 text-amber-500" />
          });
        }
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // 分配/移除角色按钮
  const RoleToggleButton = ({ role }: { role: Role }) => {
    const isAssigned = selectedRoles.includes(role.role_key);

    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant={isAssigned ? "destructive" : "default"}
          size="sm"
          onClick={() => toggleRole(role.role_key, !isAssigned)}
         
        >
          {isAssigned ? (
            <>
              <XCircle className="h-4 w-4 " />
              移除角色
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              分配角色
            </>
          )}
        </Button>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">加载角色数据中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 用户信息和表单头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl p-4 flex items-center gap-3 w-full">
          <div className="bg-primary text-primary-foreground rounded-full p-2.5">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{username}</h3>
            <p className="text-sm text-muted-foreground">
              已分配 <span className="font-semibold text-primary">{selectedRoles.length}</span>{" "}
              个角色
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索角色..."
              className="pl-9 rounded-lg border-muted-foreground/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(order => (order === "asc" ? "desc" : "asc"))}
              className="relative overflow-hidden"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="sr-only">切换排序</span>
              {sortOrder === "asc" ? (
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.2 }}
                />
              ) : (
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilterAssigned(filter => {
                  if (filter === "all") return "assigned";
                  if (filter === "assigned") return "unassigned";
                  return "all";
                })
              }
              className="relative group"
            >
              <Filter className="h-4 w-4 mr-1" />
              {filterAssigned === "all"
                ? "全部"
                : filterAssigned === "assigned"
                ? "已分配"
                : "未分配"}
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                initial={{ width: 0, left: "50%" }}
                animate={{ width: "100%", left: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 角色列表 */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed">
          <Filter className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-muted-foreground">没有找到匹配的角色</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setFilterAssigned("all");
            }}
            className="mt-2"
          >
            清除筛选条件
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4 -mr-4">
          <motion.div className="grid grid-cols-1 gap-4" layout>
            <AnimatePresence>
              {filteredRoles.map((role, index) => {
                const isSelected = selectedRoles.includes(role.role_key);
                return (
                  <motion.div
                    key={role.role_key}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    layout
                  >
                    <motion.div
                      className={`
                        relative overflow-hidden rounded-xl border 
                        transition-all duration-200
                      `}
                      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                     
                    >
                      {/* 角色卡片内容 */}
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="text-lg font-medium">{role.name}</h4>
                              {isSelected && (
                                <Badge className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
                                  已分配
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                                {role.role_key}
                              </Badge>
                            </div>

                            <AnimatePresence>
                              {role.description && (
                                <motion.p
                                  className="text-sm text-muted-foreground mb-3"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  {role.description}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center gap-2">
                  
                            <RoleToggleButton role={role} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      )}
    </div>
  );
}
