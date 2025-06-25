'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Popconfirm,
  Tag,
  Form,
  Modal,
  Input,
  Switch,
  Tree,
  Badge,
} from 'antd';
import { ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@/hooks/use-api-query';
import { httpClient } from '@/lib/http-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

// 角色数据类型
interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userRoles: number;
    roleMenus: number;
  };
}

// 菜单数据类型
interface MenuItem {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  parentId?: string;
  children?: MenuItem[];
}

export default function RoleManagementPage() {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(null);
  const queryClient = useQueryClient();

  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Role | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState<string[]>([]);

  // ========== 数据查询 Hooks ==========

  // 获取菜单树
  const { data: menuTreeData, isLoading: isMenuTreeLoading } = useApiQuery<
    MenuItem[]
  >(
    ['menu-tree-for-role'],
    '/menus/tree',
    {},
    { enabled: isPermissionModalOpen }
  );

  // 获取角色的菜单权限
  const { data: roleMenusData, refetch: refetchRoleMenus } = useApiQuery<
    MenuItem[]
  >(
    ['role-menus', currentRole?.id],
    `/roles/${currentRole?.id}/menus`,
    {},
    { enabled: !!currentRole?.id && isPermissionModalOpen }
  );

  // ========== 数据变更 Hooks ==========

  // 通用的 onSuccess 回调
  const onMutationSuccess = (successMessage: string) => {
    toast.success(successMessage);
    setIsModalOpen(false);
    setIsPermissionModalOpen(false);
    setEditingRecord(null);
    setCurrentRole(null);
    setSelectedRowKeys([]);
    actionRef.current?.reload();
  };

  const createMutation = useApiMutation<any, any>('/roles/create', 'post', {
    onSuccess: () => onMutationSuccess('创建成功！'),
    onError: (err: AxiosError) => {
      const message =
        (err.response?.data as any)?.message || err.message || '创建失败';
      toast.error(message);
    },
  });

  const updateMutation = useApiMutation<any, any>('/roles/update', 'post', {
    onSuccess: () => onMutationSuccess('更新成功！'),
    onError: (err: AxiosError) => {
      const message =
        (err.response?.data as any)?.message || err.message || '更新失败';
      toast.error(message);
    },
  });

  const deleteMutation = useApiMutation<any, { id: string }>(
    '/roles/delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('删除成功！'),
      onError: (err: AxiosError) => {
        const message =
          (err.response?.data as any)?.message || err.message || '删除失败';
        toast.error(message);
      },
    }
  );

  const batchDeleteMutation = useApiMutation<any, { ids: string[] }>(
    '/roles/batch-delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('批量删除成功！'),
      onError: (err: AxiosError) => {
        const message =
          (err.response?.data as any)?.message || err.message || '批量删除失败';
        toast.error(message);
      },
    }
  );

  const updatePermissionsMutation = useApiMutation<
    any,
    { roleId: string; menuIds: string[] }
  >('/roles/update-permissions', 'post', {
    onSuccess: () => {
      onMutationSuccess('权限更新成功！');
      // 刷新用户菜单
      queryClient.invalidateQueries({ queryKey: ['user-menus'] });
    },
    onError: (err: AxiosError) => {
      const message =
        (err.response?.data as any)?.message || err.message || '权限更新失败';
      toast.error(message);
    },
  });

  // ========== 事件处理函数 ==========

  const showModal = (record?: Role) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const showPermissionModal = (record: Role) => {
    setCurrentRole(record);
    setIsPermissionModalOpen(true);
  };

  const handlePermissionCancel = () => {
    setIsPermissionModalOpen(false);
    setCurrentRole(null);
    setCheckedMenuKeys([]);
  };

  // 表单提交处理
  const handleFormSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ ...values, id: editingRecord.id });
      } else {
        await createMutation.mutateAsync(values);
      }
    } catch (e) {
      // 错误已在 mutation 的 onError 中处理
    }
  };

  // 权限提交处理
  const handlePermissionSubmit = async () => {
    if (!currentRole) return;

    try {
      await updatePermissionsMutation.mutateAsync({
        roleId: currentRole.id,
        menuIds: checkedMenuKeys,
      });
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
    batchDeleteMutation.mutate({ ids: selectedRowKeys as string[] });
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
          isActive: true,
        });
      }
    }
  }, [isModalOpen, editingRecord, form]);

  // 当权限弹窗打开时，加载角色的菜单权限
  useEffect(() => {
    if (isPermissionModalOpen && roleMenusData?.data) {
      const menuIds = (roleMenusData.data as MenuItem[]).map(menu => menu.id);
      setCheckedMenuKeys(menuIds);
    }
  }, [isPermissionModalOpen, roleMenusData]);

  // ========== 表格列定义 ==========
  const columns: ProColumns<Role>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 150,
      formItemProps: {
        rules: [{ required: true, message: '请输入角色名称' }],
      },
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      width: 120,
      formItemProps: {
        rules: [{ required: true, message: '请输入角色代码' }],
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: '关联用户',
      width: 100,
      search: false,
      render: (_, record) => (
        <Badge count={record._count?.userRoles || 0} showZero>
          <UserOutlined style={{ fontSize: 20 }} />
        </Badge>
      ),
    },
    {
      title: '菜单权限',
      width: 100,
      search: false,
      render: (_, record) => (
        <Badge count={record._count?.roleMenus || 0} showZero>
          <MenuOutlined style={{ fontSize: 20 }} />
        </Badge>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.isActive ? 'success' : 'error'}>
          {record.isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <a key="permission" onClick={() => showPermissionModal(record)}>
          <SettingOutlined style={{ marginRight: 8 }} />
          权限
        </a>,
        <a key="edit" onClick={() => showModal(record)}>
          <EditOutlined style={{ marginRight: 8 }} />
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          description={
            record._count?.userRoles
              ? `有 ${record._count.userRoles} 个用户正在使用此角色`
              : '删除后不可恢复'
          }
          onConfirm={() => handleDelete(record.id)}
          disabled={!!record._count?.userRoles}
        >
          <a
            key="delete-link"
            style={{
              color: record._count?.userRoles ? '#999' : 'red',
              cursor: record._count?.userRoles ? 'not-allowed' : 'pointer',
            }}
          >
            <DeleteOutlined style={{ marginRight: 8 }} />
            删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<Role>
        columns={columns}
        actionRef={actionRef}
        request={async params => {
          // 适配新的 schema，移除旧字段
          const { current, pageSize, name, code, isActive } = params;
          const { data, code: responseCode } = await httpClient.post(
            '/roles/list',
            {
              current,
              pageSize,
              name,
              code,
              isActive,
            }
          );
          return {
            data: data?.list || [],
            total: data?.total || 0,
            success: responseCode === 200,
          };
        }}
        rowKey="id"
        pagination={{ defaultPageSize: 10 }}
        search={{ labelWidth: 'auto' }}
        scroll={{ x: 1200 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        headerTitle="角色列表"
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            新建角色
          </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batch-delete"
              title="确定删除选中的角色吗？"
              description="请确保选中的角色没有被用户使用"
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          ),
        ]}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑角色' : '新建角色'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
        width={600}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleFormSubmit}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 100, message: '角色名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="例如：管理员" />
          </Form.Item>
          <Form.Item
            name="code"
            label="角色代码"
            rules={[
              { required: true, message: '请输入角色代码' },
              { max: 50, message: '角色代码不能超过50个字符' },
              {
                pattern: /^[A-Z_]+$/,
                message: '角色代码只能包含大写字母和下划线',
              },
            ]}
          >
            <Input placeholder="例如：ADMIN" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={3}
              placeholder="请输入角色描述"
              maxLength={500}
            />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限设置弹窗 */}
      <Modal
        title={`设置权限 - ${currentRole?.name}`}
        open={isPermissionModalOpen}
        onCancel={handlePermissionCancel}
        onOk={handlePermissionSubmit}
        confirmLoading={updatePermissionsMutation.isPending}
        destroyOnHidden
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          <Tree
            checkable
            checkedKeys={checkedMenuKeys}
            onCheck={checked => setCheckedMenuKeys(checked as string[])}
            treeData={menuTreeData?.data as any}
            fieldNames={{ title: 'name', key: 'id' }}
            defaultExpandAll
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </div>
      </Modal>
    </>
  );
}
