'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link'; // 【新增】导入 Link 组件
import {
  GithubFilled,
  InfoCircleFilled,
  LogoutOutlined,
  QuestionCircleFilled,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, ProConfigProvider } from '@ant-design/pro-components';
import { Dropdown, MenuProps, Space } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useApiMutation } from '@/hooks/use-api-query';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { userApi } from '@/services/api/users';
import { MenuNode, ProLayoutMenuItem } from '@/types/menu';

const ProLayout = dynamic(() => import('@ant-design/pro-layout'), {
  ssr: false,
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter(); // router 实例不再需要在 menuItemRender 中使用
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { data, isLoading, isError, error } = userApi.getUserMenus();
  const { mutate: logout, isPending: isLoggingOut } = useApiMutation(
    '/auth/logout',
    'post',
    {
      onSuccess: () => {
        clearAuth();
        toast.success('您已成功退出登录');
        router.push('/auth/login');
      },
      onError: error => {
        toast.error(error.message || '退出失败，请稍后重试');
        clearAuth();
        router.push('/auth/login');
      },
    }
  );

  const transformMenuData = (menus: MenuNode[]): ProLayoutMenuItem[] => {
    return menus.map(menu => {
      const item: ProLayoutMenuItem = {
        path: menu.path,
        name: menu.title || menu.name,
        component: menu.component,
        hideInMenu: !menu.isVisible,
        redirect: menu.redirect,
        ...menu.meta,
      };
      if (menu.icon) {
        item.icon = <DynamicIcon name={menu.icon as IconName} />;
      }
      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        item.routes = transformMenuData(menu.children);
      }

      return item;
    });
  };

  const menuData = data?.data ? transformMenuData(data.data) : [];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => logout(),
      disabled: isLoggingOut,
      danger: true,
    },
  ];

  return (
    <ProConfigProvider hashed={false}>
      <ProLayout
        layout="mix"
        title="Yinlerens"
        logo="https://docs.sentry.io/_next/static/media/sentry-logo-dark.fc8e1eeb.svg"
        location={{ pathname }}
        menu={{
          request: async () => menuData,
          loading: isLoading,
        }}
        menuItemRender={(item, dom) => <Link href={item.path!}>{dom}</Link>}
        subMenuItemRender={(item, dom) => dom}
        onMenuHeaderClick={() => router.push('/dashboard')}
        avatarProps={{
          src: user?.avatar || undefined,
          size: 'small',
          icon: !user?.avatar && <UserOutlined />,
          title: user?.nickname || user?.email || '用户',
          render: (_, dom) => (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                {dom}
                <span style={{ color: '#595959', fontSize: 14 }}>
                  {user?.nickname || user?.email?.split('@')[0] || '用户'}
                </span>
              </Space>
            </Dropdown>
          ),
        }}
        actionsRender={props => {
          if (props.isMobile) return [];
          return [
            <InfoCircleFilled key="InfoCircleFilled" />,
            <QuestionCircleFilled key="QuestionCircleFilled" />,
            <GithubFilled key="GithubFilled" />,
          ];
        }}
        menuFooterRender={props => {
          if (props?.collapsed) return undefined;
          return (
            <div style={{ textAlign: 'center', paddingBlockStart: 20 }}>
              <div>© 2025 权限管理系统</div>
              <div>Powered by ProComponents</div>
            </div>
          );
        }}
        breadcrumbRender={(routers = []) => [
          { path: '/', breadcrumbName: '首页' },
          ...routers,
        ]}
      >
        <PageContainer header={{ title: null, ghost: true }}>
          {children}
        </PageContainer>
      </ProLayout>
    </ProConfigProvider>
  );
}
