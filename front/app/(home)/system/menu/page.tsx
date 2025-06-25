'use client';
import { useState, useRef, useEffect, Key } from 'react';
import {
  Button,
  Space,
  Popconfirm,
  Tag,
  Form,
  Modal,
  Input,
  Radio,
  InputNumber,
  Switch,
  TreeSelect,
} from 'antd';
import { ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@/hooks/use-api-query';
import { httpClient } from '@/lib/http-client';
import { useQueryClient } from '@tanstack/react-query';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';
import { toast } from 'sonner';

// 菜单数据类型
type MenuType = 'DIRECTORY' | 'MENU' | 'EXTERNAL';
interface MenuItem {
  id: string;
  name: string;
  code: string;
  type: MenuType;
  path?: string;
  component?: string;
  title: string;
  icon?: string;
  parentId?: string;
  sort: number;
  isVisible: boolean;
  isActive: boolean;
  isCache: boolean;
  isAffix: boolean;
  children?: MenuItem[];
}

export default function MenuManagementPage() {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(null);
  const queryClient = useQueryClient();

  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MenuItem | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ========== 数据查询 Hooks ==========
  const { data: menuTreeData, isLoading: isTreeLoading } = useApiQuery(
    ['menu-tree'],
    '/menus/tree',
    {},
    {}
  );

  // ========== 数据变更 Hooks (Mutation) ==========

  // 通用的 onSuccess 回调，用于刷新所有相关数据
  const onMutationSuccess = (successMessage: string) => {
    toast.success(successMessage);
    setIsModalOpen(false);
    setEditingRecord(null);
    setSelectedRowKeys([]);
    actionRef.current?.reload(); // 刷新表格
    // 实现与 Layout 菜单的联动
    queryClient.invalidateQueries({ queryKey: ['user-menus'] }); // 刷新ProLayout菜单
    queryClient.invalidateQueries({ queryKey: ['menu-tree'] }); // 刷新表单里的上级菜单树
  };

  const createMutation = useApiMutation('/menus/create', 'post', {
    onSuccess: () => onMutationSuccess('新建成功！'),
    onError: err => toast.error(err.message || '新建失败'),
  });

  const updateMutation = useApiMutation('/menus/update', 'post', {
    onSuccess: () => onMutationSuccess('更新成功！'),
    onError: err => toast.error(err.message || '更新失败'),
  });

  const deleteMutation = useApiMutation<any, { id: string }>(
    '/menus/delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('删除成功！'),
      onError: err => toast.error(err.message || '删除失败'),
    }
  );

  const batchDeleteMutation = useApiMutation<any, { ids: Key[] }>(
    '/menus/batch-delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('批量删除成功！'),
      onError: err => toast.error(err.message || '批量删除失败'),
    }
  );

  // ========== 事件处理函数 ==========

  const showModal = (record?: MenuItem) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // 表单提交处理
  const handleFormSubmit = async (values: any) => {
    const payload = { ...values };
    try {
      if (editingRecord) {
        // 更新操作
        await updateMutation.mutateAsync({ ...payload, id: editingRecord.id });
      } else {
        // 新建操作
        await createMutation.mutateAsync(payload);
      }
    } catch (e) {
      // 错误已在 mutation 的 onError 中处理
    }
  };

  // 删除单项
  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  // 批量删除
  const handleBatchDelete = () => {
    batchDeleteMutation.mutate({ ids: selectedRowKeys });
  };

  // ========== Effects ==========

  // 当编辑记录或弹窗状态变化时，设置表单值
  useEffect(() => {
    if (isModalOpen) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord);
      } else {
        form.resetFields();
        // 设置新建时的默认值
        form.setFieldsValue({
          type: 'MENU',
          sort: 0,
          isVisible: true,
          isActive: true,
          isCache: false,
          isAffix: false,
        });
      }
    }
  }, [isModalOpen, editingRecord, form]);

  // ========== 表格列定义 ==========
  const columns: ProColumns<MenuItem>[] = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <Space>
          <DynamicIcon name={record.icon as IconName} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      width: 180,
      copyable: true,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tag color={record.isVisible ? 'success' : 'default'}>
            {record.isVisible ? '显示' : '隐藏'}
          </Tag>
          <Tag color={record.isActive ? 'success' : 'error'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <a key="edit" onClick={() => showModal(record)}>
          <EditOutlined style={{ marginRight: 8 }} />
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          description="删除后，其子菜单也会被一并删除！"
          onConfirm={() => handleDelete(record.id)}
        >
          <a key="delete-link" style={{ color: 'red' }}>
            <DeleteOutlined style={{ marginRight: 8 }} />
            删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<MenuItem>
        columns={columns}
        actionRef={actionRef}
        request={async params => {
          const { data, code } = await httpClient.post('/menus/list', params);
          return {
            data: data?.list || [],
            total: data?.total || 0,
            success: code === 200,
          };
        }}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 1300 }}
        expandable={{}}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        headerTitle="菜单列表"
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            新建菜单
          </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batch-delete"
              title="确定删除选中的菜单吗？"
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          ),
        ]}
      />

      {/* 新建/编辑弹窗 (使用标准 Antd Modal 和 Form) */}
      <Modal
        title={editingRecord ? '编辑菜单' : '新建菜单'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden // 关闭时销毁内部组件，避免数据缓存问题
        width={680}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleFormSubmit}
          style={{ paddingTop: 24 }}
        >
          <Form.Item name="parentId" label="上级菜单">
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              placeholder="请选择上级菜单 (不选则为顶级)"
              allowClear
              treeDefaultExpandAll
              treeNodeFilterProp="name"
              treeData={(menuTreeData?.data || []) as any[]}
              loading={isTreeLoading}
              fieldNames={{ label: 'name', value: 'id' }}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="例如：用户管理" />
          </Form.Item>
          <Form.Item
            name="path"
            label="路由路径"
            rules={[{ required: true, message: '请输入路由路径' }]}
          >
            <Input placeholder="例如：/system/user" />
          </Form.Item>
          <Form.Item name="icon" label="菜单图标">
            <Input placeholder="请输入图标名称,如:user" />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序号"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="状态">
            <Space>
              <Form.Item name="isVisible" valuePropName="checked" noStyle>
                <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
              </Form.Item>
              <Form.Item name="isActive" valuePropName="checked" noStyle>
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
