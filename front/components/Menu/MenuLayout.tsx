"use client";
import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer, Breadcrumb } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, HomeOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useMenuTree } from "@/hooks/useMenus";
import { MenuTreeNode, MenuType, MenuTarget } from "@/types/menu";
import DynamicIcon from "@/components/icon/DynamicIcon";
import type { MenuProps } from "antd";
import { useApiQuery } from "@/hooks/use-api-query";
import { GithubFilled, InfoCircleFilled, QuestionCircleFilled } from "@ant-design/icons";
import { MenuDataItem, PageContainer, ProCard } from "@ant-design/pro-components";
import defaultProps from "./_defaultProps";
import dynamic from "next/dynamic";
const ProLayout = dynamic(() => import("@ant-design/pro-layout"), {
  ssr: false
});
interface MenuLayoutProps {
  children: React.ReactNode;
}

type MenuItem = Required<MenuProps>["items"][number];

const MenuLayout: React.FC<MenuLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [breadcrumbItems, setBreadcrumbItems] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending, error } = useApiQuery<MenuTreeNode[]>(["menus/tree"], "/menus/tree");
  const menuTree = data?.data || [];

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    if (menuTree && pathname) {
      const { selectedKeys, openKeys, breadcrumb } = findMenuByPath(menuTree, pathname);
      setSelectedKeys(selectedKeys);
      setOpenKeys(openKeys);
      setBreadcrumbItems(breadcrumb);
    }
  }, [menuTree, pathname]);

  // 转换菜单树为Ant Design Menu组件需要的格式
  const convertToMenuItems = (nodes: MenuTreeNode[]): MenuItem[] => {
    return nodes
      .filter(node => node.isVisible && node.isEnabled && node.type === MenuType.MENU)
      .map(node => {
        const item: MenuItem = {
          key: node.id,
          label: node.title,
          icon: node.icon ? <DynamicIcon name={node.icon as any} /> : undefined
        };

        if (node.children && node.children.length > 0) {
          const childItems = convertToMenuItems(node.children);
          if (childItems.length > 0) {
            (item as any).children = childItems;
          }
        }

        return item;
      });
  };

  // 根据路径查找菜单项
  const findMenuByPath = (nodes: MenuTreeNode[], targetPath: string) => {
    let selectedKeys: string[] = [];
    let openKeys: string[] = [];
    let breadcrumb: any[] = [
      {
        title: (
          <span>
            <HomeOutlined />
            <span>首页</span>
          </span>
        )
      }
    ];

    const traverse = (
      nodes: MenuTreeNode[],
      parentKeys: string[] = [],
      parentBreadcrumb: any[] = []
    ) => {
      for (const node of nodes) {
        const currentKeys = [...parentKeys, node.id];
        const currentBreadcrumb = [
          ...parentBreadcrumb,
          {
            title: (
              <span>
                {node.icon && <DynamicIcon name={node.icon as any} className="mr-1" />}
                {node.title}
              </span>
            )
          }
        ];

        if (node.path === targetPath) {
          selectedKeys = [node.id];
          openKeys = parentKeys;
          breadcrumb = [...breadcrumb, ...currentBreadcrumb];
          return true;
        }

        if (node.children && node.children.length > 0) {
          if (traverse(node.children, currentKeys, currentBreadcrumb)) {
            return true;
          }
        }
      }
      return false;
    };

    traverse(nodes);
    return { selectedKeys, openKeys, breadcrumb };
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    if (menuTree) {
      const menu = findMenuById(menuTree, key);
      if (menu && menu.path) {
        if (menu.type === MenuType.EXTERNAL) {
          // 外部链接
          const target = menu.target === MenuTarget.BLANK ? "_blank" : "_self";
          window.open(menu.path, target);
        } else {
          // 内部路由
          router.push(menu.path);
        }
      }
    }
  };

  // 根据ID查找菜单
  const findMenuById = (nodes: MenuTreeNode[], id: string): MenuTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = findMenuById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const menuItems = menuTree ? convertToMenuItems(menuTree) : [];
  const loopMenuItem = (menus: any[]): MenuDataItem[] =>
    menus.map(({ icon, routes, ...item }) => ({
      ...item,
      // icon: icon && IconMap[icon as "smile"],
      children: routes && loopMenuItem(routes)
    }));
  return (
    <div id="test-pro-layout" className="h-full">
      <ProLayout
        title="Yinleren"
        logo="https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg"
        siderWidth={216}
        menu={{ request: async () => loopMenuItem(menuTree) }}
        location={{
          pathname
        }}
        avatarProps={{
          src: "https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg",
          title: "七妮妮",
          size: "small"
        }}
        actionsRender={props => {
          if (props.isMobile) return [];
          return [
            <InfoCircleFilled key="InfoCircleFilled" />,
            <QuestionCircleFilled key="QuestionCircleFilled" />,
            <GithubFilled key="GithubFilled" />
          ];
        }}
        menuItemRender={(item, dom) => <div onClick={() => {}}>{dom}</div>}
      >
        <PageContainer>
          <ProCard
            style={{
              height: "100vh",
              minHeight: 800
            }}
          >
            {children}
          </ProCard>
        </PageContainer>
      </ProLayout>
    </div>
  );
};

export default MenuLayout;
