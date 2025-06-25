'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Space,
  Popconfirm,
  Tag,
  Form,
  Modal,
  Input,
  Switch,
  Select,
  message,
  Avatar,
  Tooltip,
} from 'antd';
import { ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@/hooks/use-api-query';
import { httpClient } from '@/lib/http-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

// 用户数据类型
interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  status: UserStatus;
  isActive: boolean;
  registeredAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  loginCount: number;
  profileCompleted: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles?: UserRole[];
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

// 用户状态枚举
enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

// 用户状态配置
const userStatusConfig = {
  ACTIVE: { label: '活跃', color: 'success' },
  INACTIVE: { label: '未激活', color: 'default' },
  SUSPENDED: { label: '暂停', color: 'warning' },
  BANNED: { label: '禁用', color: 'error' },
};

export default function UserManagementPage() {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(null);

  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);

  // 在 Effects 部分添加
  useEffect(() => {
    if (isRoleModalOpen) {
      setIsRolesLoading(true);
      httpClient
        .post('/roles/list', {
          current: 1,
          pageSize: 100,
          isActive: true,
        })
        .then(res => {
          if (res.code === 200) {
            setRolesList(res.data?.list || []);
          }
        })
        .finally(() => {
          setIsRolesLoading(false);
        });
    }
  }, [isRoleModalOpen]);
  // ========== 数据查询 Hooks ==========

  // ========== 数据变更 Hooks ==========

  // 通用的 onSuccess 回调
  const onMutationSuccess = (successMessage: string) => {
    toast.success(successMessage);
    setIsModalOpen(false);
    setIsRoleModalOpen(false);
    setIsPasswordModalOpen(false);
    setEditingRecord(null);
    setCurrentUser(null);
    setSelectedRowKeys([]);
    actionRef.current?.reload();
  };

  const createMutation = useApiMutation<any, any>('/users/create', 'post', {
    onSuccess: () => onMutationSuccess('创建成功！'),
    onError: (err: AxiosError<any>) => {
      const message = err.response?.data?.message || err.message || '创建失败';
      toast.error(message);
    },
  });

  const updateMutation = useApiMutation<any, any>('/users/update', 'post', {
    onSuccess: () => onMutationSuccess('更新成功！'),
    onError: (err: AxiosError<any>) => {
      const message = err.response?.data?.message || err.message || '更新失败';
      toast.error(message);
    },
  });

  const deleteMutation = useApiMutation<any, { id: string }>(
    '/users/delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('删除成功！'),
      onError: (err: AxiosError<any>) => {
        const message =
          err.response?.data?.message || err.message || '删除失败';
        toast.error(message);
      },
    }
  );

  const batchDeleteMutation = useApiMutation<any, { ids: string[] }>(
    '/users/batch-delete',
    'post',
    {
      onSuccess: () => onMutationSuccess('批量删除成功！'),
      onError: (err: AxiosError<any>) => {
        const message =
          err.response?.data?.message || err.message || '批量删除失败';
        toast.error(message);
      },
    }
  );

  const assignRolesMutation = useApiMutation<
    any,
    { userId: string; roleIds: string[] }
  >('/users/assign-roles', 'post', {
    onSuccess: () => onMutationSuccess('角色分配成功！'),
    onError: (err: AxiosError<any>) => {
      const message =
        err.response?.data?.message || err.message || '角色分配失败';
      toast.error(message);
    },
  });

  const resetPasswordMutation = useApiMutation<
    any,
    { userId: string; password: string }
  >('/users/reset-password', 'post', {
    onSuccess: () => {
      onMutationSuccess('密码重置成功！');
      passwordForm.resetFields();
    },
    onError: (err: AxiosError<any>) => {
      const message =
        err.response?.data?.message || err.message || '密码重置失败';
      toast.error(message);
    },
  });

  // ========== 事件处理函数 ==========

  const showModal = (record?: User) => {
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const showRoleModal = (record: User) => {
    setCurrentUser(record);
    setSelectedRoleIds(record.userRoles?.map(ur => ur.roleId) || []);
    setIsRoleModalOpen(true);
  };

  const handleRoleCancel = () => {
    setIsRoleModalOpen(false);
    setCurrentUser(null);
    setSelectedRoleIds([]);
  };

  const showPasswordModal = (record: User) => {
    setCurrentUser(record);
    setIsPasswordModalOpen(true);
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

  // 角色分配提交
  const handleRoleSubmit = async () => {
    if (!currentUser) return;

    try {
      await assignRolesMutation.mutateAsync({
        userId: currentUser.id,
        roleIds: selectedRoleIds,
      });
    } catch (e) {
      // 错误已在 mutation 的 onError 中处理
    }
  };

  // 密码重置提交
  const handlePasswordSubmit = async (values: any) => {
    if (!currentUser) return;

    try {
      await resetPasswordMutation.mutateAsync({
        userId: currentUser.id,
        password: values.password,
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
        form.setFieldsValue({
          ...editingRecord,
          password: undefined, // 编辑时不显示密码
        });
      } else {
        form.resetFields();
        // 设置新建时的默认值
        form.setFieldsValue({
          status: UserStatus.ACTIVE,
          isActive: true,
        });
      }
    }
  }, [isModalOpen, editingRecord, form]);

  // ========== 表格列定义 ==========
  const columns: ProColumns<User>[] = [
    {
      title: '用户信息',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>{record.nickname || record.email}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      hideInTable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      hideInTable: true,
    },
    {
      title: '手机',
      dataIndex: 'phone',
      width: 120,
      render: phone => phone || '-',
    },
    {
      title: '角色',
      width: 200,
      render: (_, record) => (
        <Space wrap>
          {record.userRoles?.map(ur => (
            <Tag key={ur.id} color="blue">
              {ur.role.name}
            </Tag>
          )) || <span style={{ color: '#999' }}>未分配</span>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: Object.keys(userStatusConfig).reduce((acc, key) => {
        acc[key] = {
          text: userStatusConfig[key as UserStatus].label,
          status: userStatusConfig[key as UserStatus].color as any,
        };
        return acc;
      }, {} as any),
      render: (_, record) => (
        <Tag color={userStatusConfig[record.status].color}>
          {userStatusConfig[record.status].label}
        </Tag>
      ),
    },
    {
      title: '启用状态',
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
      title: '注册时间',
      dataIndex: 'registeredAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
      render: (_, record) => record.lastLoginAt || '-',
    },
    {
      title: '登录次数',
      dataIndex: 'loginCount',
      width: 80,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <a key="role" onClick={() => showRoleModal(record)}>
          <TeamOutlined style={{ marginRight: 8 }} />
          角色
        </a>,
        <a key="edit" onClick={() => showModal(record)}>
          <EditOutlined style={{ marginRight: 8 }} />
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          description="删除后不可恢复"
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
      <ProTable<User>
        columns={columns}
        actionRef={actionRef}
        request={async params => {
          const {
            current,
            pageSize,
            nickname,
            email,
            phone,
            status,
            isActive,
          } = params;
          const { data, code: responseCode } = await httpClient.post(
            '/users/list',
            {
              current,
              pageSize,
              nickname,
              email,
              phone,
              status,
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
        scroll={{ x: 1500 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        headerTitle="用户列表"
        toolBarRender={() => [
          // <Button
          //   type="primary"
          //   key="create"
          //   icon={<PlusOutlined />}
          //   onClick={() => showModal()}
          // >
          //   新建用户
          // </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batch-delete"
              title="确定删除选中的用户吗？"
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          ),
        ]}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑用户' : '新建用户'}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
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
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="user@example.com"
              disabled={!!editingRecord}
            />
          </Form.Item>
          {!editingRecord && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>
          )}
          <Form.Item
            name="status"
            label="用户状态"
            rules={[{ required: true }]}
          >
            <Select>
              {Object.entries(userStatusConfig).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  {config.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色分配弹窗 */}
      <Modal
        title={`分配角色 - ${currentUser?.nickname || currentUser?.email}`}
        open={isRoleModalOpen}
        onCancel={handleRoleCancel}
        onOk={handleRoleSubmit}
        confirmLoading={assignRolesMutation.isPending}
        destroyOnHidden
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择角色"
            value={selectedRoleIds}
            onChange={setSelectedRoleIds}
            loading={isRolesLoading}
          >
            {rolesList.map(role => (
              <Select.Option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码 - ${currentUser?.nickname || currentUser?.email}`}
        open={isPasswordModalOpen}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setCurrentUser(null);
          passwordForm.resetFields();
        }}
        onOk={() => passwordForm.submit()}
        confirmLoading={resetPasswordMutation.isPending}
        destroyOnHidden
        width={500}
      >
        <Form
          form={passwordForm}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={handlePasswordSubmit}
          style={{ paddingTop: 24 }}
        >
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
