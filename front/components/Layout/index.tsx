"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  GithubFilled,
  InfoCircleFilled,
  LogoutOutlined,
  QuestionCircleFilled,
  SettingOutlined,
  UserOutlined
} from "@ant-design/icons";
import { PageContainer, ProCard, ProConfigProvider, ProSettings } from "@ant-design/pro-components";
import { ConfigProvider, Dropdown, theme, Avatar, Space, message } from "antd";
import {
  Shield,
  Users,
  FileText,
  Building2,
  Key,
  Menu,
  LayoutDashboard,
  FileSearch,
  Settings,
  Database
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useApiQuery } from "@/hooks/use-api-query";
import { httpClient } from "@/lib/http-client";
import zhCN from "antd/locale/zh_CN";
import dynamic from "next/dynamic";
import DynamicIcon from "../icon/DynamicIcon";
const ProLayout = dynamic(() => import("@ant-design/pro-layout"), {
  ssr: false
});
// 菜单图标映射
const IconMap: Record<string, React.ReactNode> = {
  dashboard: <DynamicIcon name="layout-dashboard" />,
  system: <DynamicIcon name="settings" />,
  user: <DynamicIcon name="user" />,
  role: <DynamicIcon name="shield" />,
  menu: <DynamicIcon name="menu" />,
  department: <DynamicIcon name="building-2" />,
  ability: <DynamicIcon name="key" />,
  audit: <DynamicIcon name="file-search" />,
  database: <DynamicIcon name="database" />
};

// ProLayout 设置
const defaultSettings: ProSettings = {
  layout: "mix",
  splitMenus: false,
  fixedHeader: true,
  fixSiderbar: true,
  siderMenuType: "group",
  title: "权限管理系统",
  colorPrimary: "#1772b4",
  contentWidth: "Fluid"
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [settings, setSetting] = useState<ProSettings>(defaultSettings);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取当前用户菜单
  const { data: menusResponse, isLoading: menuLoading } = useApiQuery(
    ["user-menus"],
    "/user/menus",
    {},
    {
      enabled: isAuthenticated,
      retry: 1
    }
  );

  // 处理菜单数据
  useEffect(() => {
    if (menusResponse?.data) {
      const formatMenus = (menus: any[]): any[] => {
        return menus.map(menu => ({
          key: menu.id,
          path: menu.path || `/${menu.code}`,
          name: menu.title || menu.name,
          icon: IconMap[menu.icon] || IconMap[menu.code] || <FileText size={16} />,
          hideInMenu: !menu.isVisible,
          children: menu.children ? formatMenus(menu.children) : undefined
        }));
      };
      setMenuData(formatMenus(menusResponse.data));
    }
  }, [menusResponse]);

  // // 未登录跳转
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/auth/login");
  //   }
  // }, [isAuthenticated, router]);

  // 默认菜单数据（开发时使用）
  const defaultMenus = [
    {
      path: "/dashboard",
      name: "仪表盘",
      icon: <LayoutDashboard size={16} />
    },
    {
      path: "/system",
      name: "系统管理",
      icon: <Settings size={16} />,
      children: [
        {
          path: "/system/user",
          name: "用户管理",
          icon: <Users size={16} />
        },
        {
          path: "/system/role",
          name: "角色管理",
          icon: <Shield size={16} />
        },
        {
          path: "/system/menu",
          name: "菜单管理",
          icon: <Menu size={16} />
        },
        {
          path: "/system/department",
          name: "部门管理",
          icon: <Building2 size={16} />
        },
        {
          path: "/system/ability",
          name: "权限管理",
          icon: <Key size={16} />
        }
      ]
    },
    {
      path: "/audit",
      name: "审计日志",
      icon: <FileSearch size={16} />
    }
  ];

  // 退出登录
  const handleLogout = async () => {
    setLoading(true);
    try {
      await httpClient.post("/auth/logout");
      // logout();
      message.success("退出成功");
      router.push("/auth/login");
    } catch (error) {
      message.error("退出失败");
    } finally {
      setLoading(false);
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
      onClick: () => router.push("/profile")
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "个人设置",
      onClick: () => router.push("/settings")
    },
    {
      type: "divider" as const
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
      danger: true
    }
  ];

  return (
    <ProConfigProvider hashed={false}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          cssVar: true,
          token: {
            colorPrimary: settings.colorPrimary || "#1772b4"
          }
        }}
      >
        <ProLayout
          title="权限管理系统"
          logo="https://docs.sentry.io/_next/static/media/sentry-logo-dark.fc8e1eeb.svg"
          {...settings}
          location={{
            pathname
          }}
          token={{
            header: {
              colorBgMenuItemSelected: "rgba(0,0,0,0.04)"
            },
            sider: {
              colorMenuBackground: "#fff",
              colorMenuItemDivider: "#dfdfdf",
              colorTextMenu: "#595959",
              colorTextMenuSelected: "#1772b4",
              colorBgMenuItemSelected: "#e6f4ff"
            }
          }}
          menu={{
            loading: menuLoading,
            request: async () => {
              // 如果有真实菜单数据则使用，否则使用默认菜单
              return menuData.length > 0 ? menuData : defaultMenus;
            }
          }}
          avatarProps={{
            src: user?.avatar || undefined,
            size: "small",
            icon: !user?.avatar && <UserOutlined />,
            title: user?.nickname || user?.email || "用户",
            render: (_, dom) => {
              return (
                <Dropdown
                  menu={{
                    items: userMenuItems
                  }}
                  placement="bottomRight"
                >
                  <Space style={{ cursor: "pointer" }}>
                    {dom}
                    <span style={{ color: "#595959", fontSize: 14 }}>
                      {user?.nickname || user?.email?.split("@")[0] || "用户"}
                    </span>
                  </Space>
                </Dropdown>
              );
            }
          }}
          actionsRender={props => {
            if (props.isMobile) return [];
            return [
              <InfoCircleFilled key="InfoCircleFilled" />,
              <QuestionCircleFilled key="QuestionCircleFilled" />,
              <GithubFilled key="GithubFilled" />
            ];
          }}
          menuFooterRender={props => {
            if (props?.collapsed) return undefined;
            return (
              <div
                style={{
                  textAlign: "center",
                  paddingBlockStart: 20
                }}
              >
                <div>© 2025 权限管理系统</div>
                <div>Powered by ProComponents</div>
              </div>
            );
          }}
          onMenuHeaderClick={e => router.push("/dashboard")}
          menuItemRender={(item, dom) => (
            <div
              onClick={() => {
                router.push(item.path || "/dashboard");
              }}
            >
              {dom}
            </div>
          )}
          breadcrumbRender={(routers = []) => [
            {
              path: "/",
              breadcrumbName: "首页"
            },
            ...routers
          ]}
          onSettingChange={settings => {
            setSetting(settings);
          }}
        >
          <PageContainer
            header={{
              title: null,
              ghost: true
            }}
          >
            {loading ? <ProCard loading style={{ minHeight: "60vh" }} /> : children}
          </PageContainer>
        </ProLayout>
      </ConfigProvider>
    </ProConfigProvider>
  );
}
