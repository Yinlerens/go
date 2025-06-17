"use client";

import React, { useState } from 'react';
import { 
  Layout, 
  Tabs, 
  Modal, 
  Button, 
  Space,
  Breadcrumb,
  Typography
} from 'antd';
import { 
  MenuOutlined, 
  TableOutlined, 
  PartitionOutlined,
  BarChartOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Menu, CreateMenuRequest, UpdateMenuRequest } from '@/types/menu';
import { useCreateMenu, useUpdateMenu } from '@/hooks/useMenus';
import MenuList from '@/components/Menu/MenuList';
import MenuTree from '@/components/Menu/MenuTree';
import MenuForm from '@/components/Menu/MenuForm';
import MenuStats from '@/components/Menu/MenuStats';

const { Content } = Layout;
const { Title } = Typography;

type TabKey = 'list' | 'tree' | 'stats';

const MenuManagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>();
  const [parentId, setParentId] = useState<string | undefined>();

  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();

  // 处理新建菜单
  const handleAdd = (parentMenuId?: string) => {
    setEditingMenu(undefined);
    setParentId(parentMenuId);
    setIsModalVisible(true);
  };

  // 处理编辑菜单
  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setParentId(undefined);
    setIsModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async (data: CreateMenuRequest | UpdateMenuRequest) => {
    try {
      if (editingMenu) {
        // 更新菜单
        await updateMenuMutation.mutateAsync(data as UpdateMenuRequest);
      } else {
        // 创建菜单
        const createData = { ...data as CreateMenuRequest };
        if (parentId) {
          createData.parentId = parentId;
        }
        await createMenuMutation.mutateAsync(createData);
      }
      setIsModalVisible(false);
      setEditingMenu(undefined);
      setParentId(undefined);
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingMenu(undefined);
    setParentId(undefined);
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <TableOutlined />
          列表视图
        </span>
      ),
      children: (
        <MenuList
          onEdit={handleEdit}
          onAdd={() => handleAdd()}
        />
      )
    },
    {
      key: 'tree',
      label: (
        <span>
          <PartitionOutlined />
          树形视图
        </span>
      ),
      children: (
        <MenuTree
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      )
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          统计信息
        </span>
      ),
      children: <MenuStats />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <Layout>
        <Content className="p-6">

          <div className="mb-6">
            <Title level={2} className="mb-2">
              <MenuOutlined className="mr-2" />
              菜单管理
            </Title>
            <p className="text-gray-600">
              管理系统菜单结构，包括菜单的创建、编辑、删除和权限配置
            </p>
          </div>

          {/* 主要内容区域 */}
          <div className="bg-white rounded-lg shadow-sm">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabKey)}
              items={tabItems}
              className="px-6 pt-6"
            />
          </div>

          {/* 菜单表单模态框 */}
          <Modal
            title={editingMenu ? '编辑菜单' : '新建菜单'}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            width={800}
          >
            <MenuForm
              menu={editingMenu}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={createMenuMutation.isPending || updateMenuMutation.isPending}
            />
          </Modal>
        </Content>
      </Layout>
    </motion.div>
  );
};

export default MenuManagePage;
