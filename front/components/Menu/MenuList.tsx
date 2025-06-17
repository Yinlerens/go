"use client";

import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Popconfirm, 
  Input, 
  Select, 
  Card,
  Row,
  Col,
  Tooltip,
  Badge,
  Switch
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Menu, MenuType, MenuQueryParams } from '@/types/menu';
import { useMenus, useDeleteMenu, useUpdateMenu } from '@/hooks/useMenus';
import DynamicIcon from '@/components/icon/DynamicIcon';
import { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Search } = Input;

interface MenuListProps {
  onEdit: (menu: Menu) => void;
  onAdd: () => void;
}

const MenuList: React.FC<MenuListProps> = ({ onEdit, onAdd }) => {
  const [queryParams, setQueryParams] = useState<MenuQueryParams>({
    page: 1,
    pageSize: 10,
    sortBy: 'sort',
    sortOrder: 'asc'
  });

  const { data, isLoading, error } = useMenus(queryParams);
  const deleteMenuMutation = useDeleteMenu();
  const updateMenuMutation = useUpdateMenu();

  // 处理搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      search: value || undefined,
      page: 1
    }));
  };

  // 处理类型筛选
  const handleTypeFilter = (type: MenuType | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      type,
      page: 1
    }));
  };

  // 处理可见性筛选
  const handleVisibilityFilter = (isVisible: boolean | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      isVisible,
      page: 1
    }));
  };

  // 处理启用状态筛选
  const handleEnabledFilter = (isEnabled: boolean | undefined) => {
    setQueryParams(prev => ({
      ...prev,
      isEnabled,
      page: 1
    }));
  };

  // 处理分页
  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setQueryParams(prev => ({
      ...prev,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sortBy: sorter.field || 'sort',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc'
    }));
  };

  // 处理删除
  const handleDelete = (id: string) => {
    deleteMenuMutation.mutate(id);
  };

  // 快速切换可见性
  const handleToggleVisibility = (menu: Menu) => {
    updateMenuMutation.mutate({
      id: menu.id,
      isVisible: !menu.isVisible
    });
  };

  // 快速切换启用状态
  const handleToggleEnabled = (menu: Menu) => {
    updateMenuMutation.mutate({
      id: menu.id,
      isEnabled: !menu.isEnabled
    });
  };

  // 获取菜单类型标签
  const getTypeTag = (type: MenuType) => {
    const typeConfig = {
      [MenuType.MENU]: { color: 'blue', text: '菜单' },
      [MenuType.BUTTON]: { color: 'green', text: '按钮' },
      [MenuType.IFRAME]: { color: 'orange', text: '内嵌' },
      [MenuType.EXTERNAL]: { color: 'purple', text: '外链' }
    };
    
    const config = typeConfig[type];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<Menu> = [
    {
      title: '菜单信息',
      key: 'info',
      width: 300,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {record.icon && (
              <DynamicIcon name={record.icon as any} className="w-4 h-4" />
            )}
            <span className="font-medium">{record.title}</span>
            {getTypeTag(record.type)}
          </div>
          <div className="text-sm text-gray-500">
            名称: {record.name}
          </div>
          {record.subtitle && (
            <div className="text-sm text-gray-400">
              {record.subtitle}
            </div>
          )}
          {record.path && (
            <div className="text-sm text-blue-500">
              路径: {record.path}
            </div>
          )}
        </div>
      )
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      sorter: true,
      render: (level) => (
        <Badge count={level} color="blue" />
      )
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      sorter: true
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Switch
              size="small"
              checked={record.isVisible}
              onChange={() => handleToggleVisibility(record)}
              loading={updateMenuMutation.isPending}
            />
            <span className="text-xs">
              {record.isVisible ? '显示' : '隐藏'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              size="small"
              checked={record.isEnabled}
              onChange={() => handleToggleEnabled(record)}
              loading={updateMenuMutation.isPending}
            />
            <span className="text-xs">
              {record.isEnabled ? '启用' : '禁用'}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '权限',
      key: 'auth',
      width: 100,
      render: (_, record) => (
        <div className="space-y-1">
          <Tag color={record.requireAuth ? 'red' : 'green'}>
            {record.requireAuth ? '需认证' : '无需认证'}
          </Tag>
          {record.permissions.length > 0 && (
            <div className="text-xs text-gray-500">
              权限: {record.permissions.length}个
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个菜单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMenuMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-lg">
        {/* 搜索和筛选区域 */}
        <div className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索菜单名称、标题或路径"
                allowClear
                onSearch={handleSearch}
                className="w-full"
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="菜单类型"
                allowClear
                onChange={handleTypeFilter}
                className="w-full"
              >
                <Option value={MenuType.MENU}>菜单</Option>
                <Option value={MenuType.BUTTON}>按钮</Option>
                <Option value={MenuType.IFRAME}>内嵌页面</Option>
                <Option value={MenuType.EXTERNAL}>外部链接</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="显示状态"
                allowClear
                onChange={handleVisibilityFilter}
                className="w-full"
              >
                <Option value={true}>显示</Option>
                <Option value={false}>隐藏</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="启用状态"
                allowClear
                onChange={handleEnabledFilter}
                className="w-full"
              >
                <Option value={true}>启用</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                className="w-full"
              >
                新建菜单
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={data?.data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: data?.data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          className="overflow-hidden"
        />
      </Card>
    </motion.div>
  );
};

export default MenuList;