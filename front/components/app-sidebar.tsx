"use client";

import * as React from "react";
import { ArrowUpCircleIcon } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useMenuStore } from "@/store/menu-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";
interface RawMenuItem {
  id: string | number; // 假设有唯一 ID 用于可能的 key
  name: string;
  path: string;
  icon?: any; // 图标名称字符串
  children?: RawMenuItem[];
}
export interface NavMainItemProps {
  title: string;
  url: string;
  icon?: any;
  items?: NavMainItemProps[];
  // 可能还需要 key 属性，取决于 NavMain 的实现
  // key?: string | number;
}
// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: ""
  }
};
const transformMenuItems = (menuItems: RawMenuItem[]): NavMainItemProps[] => {
  return menuItems.map(item => ({
    title: item.name,
    url: item.path,
    icon: item.icon,
    items: item.children ? transformMenuItems(item.children) : undefined
  }));
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { menuItems } = useMenuStore();
  const navMainItems = React.useMemo(() => {
    return transformMenuItems(menuItems);
  }, [menuItems]);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
