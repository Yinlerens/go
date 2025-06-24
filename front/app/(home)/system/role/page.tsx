"use client";

import { useState, useRef } from "react";
import {
  ProTable,
  ProColumns,
  ActionType,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormSwitch,
  ModalForm,
  ProFormTextArea,
  ProCard,
  ProFormRadio,
  ProFormCheckbox
} from "@ant-design/pro-components";
import {
  Button,
  Space,
  Popconfirm,
  message,
  Tag,
  Dropdown,
  Tree,
  Badge,
  Tooltip,
  Alert,
  Tabs,
  Card,
  Row,
  Col,
  Typography,
  Divider
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SafetyOutlined,
  TeamOutlined,
  CopyOutlined,
  MenuOutlined,
  KeyOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { httpClient } from "@/lib/http-client";
import type { DataNode } from "antd/es/tree";
import {
  Shield,
  Users,
  FileText,
  Building2,
  Key,
  Menu,
  Database,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";

const { Title, Text } = Typography;

// 类型定义
type RoleType = "SYSTEM" | "CUSTOM";
type DataScope = "ALL" | "DEPARTMENT" | "DEPARTMENT_TREE" | "SELF" | "CUSTOM";

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: RoleType;
  level: number;
  dataScope: DataScope;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userRoles: number;
    menus: number;
    abilities: number;
  };
}

interface Ability {
  id: string;
  name: string;
  code: string;
  module: string;
  actions: string[];
  description?: string;
  isActive: boolean;
  isSystem: boolean;
}

// 角色类型配置
const roleTypeConfig = {
  SYSTEM: { label: "系统角色", color: "red", icon: <SafetyOutlined /> },
  CUSTOM: { label: "自定义角色", color: "blue", icon: <TeamOutlined /> }
};

// 数据权限范围配置
const dataScopeConfig = {
  ALL: { label: "全部数据", color: "purple", description: "可查看所有数据" },
  DEPARTMENT_TREE: {
    label: "本部门及子部门",
    color: "blue",
    description: "可查看本部门及下级部门数据"
  },
  DEPARTMENT: { label: "本部门", color: "green", description: "仅可查看本部门数据" },
  SELF: { label: "仅本人", color: "orange", description: "仅可查看本人数据" },
  CUSTOM: { label: "自定义", color: "default", description: "自定义数据权限范围" }
};

export default function RoleManagementPage() {
  const actionRef = useRef<ActionType>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Role>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]);
  const [selectedAbilityIds, setSelectedAbilityIds] = useState<string[]>([]);

  // 获取菜单树
  const { data: menuTreeData } = useApiQuery(
    ["role-menu-tree"],
    "/menus/tree",
    {},
    { enabled: true }
  );

  // 获取功能权限列表
  const { data: abilitiesData } = useApiQuery(
    ["abilities"],
    "/abilities/list",
    {},
    { enabled: true }
  );

  // 获取角色的菜单权限
  const { data: roleMenusData, refetch: refetchRoleMenus } = useApiQuery(
    ["role-menus", currentRow?.id],
    `/roles/${currentRow?.id}/menus`,
    {},
    { enabled: !!currentRow?.id && permissionModalOpen }
  );

  // 获取角色的功能权限
  const { data: roleAbilitiesData, refetch: refetchRoleAbilities } = useApiQuery(
    ["role-abilities", currentRow?.id],
    `/roles/${currentRow?.id}/abilities`,
    {},
    { enabled: !!currentRow?.id && permissionModalOpen }
  );

  // 创建角色
  const createMutation = useApiMutation((data: any) => httpClient.post("/roles/create", data), {
    onSuccess: () => {
      message.success("创建成功");
      setCreateModalOpen(false);
      actionRef.current?.reload();
    },
    onError: () => {
      message.error("创建失败");
    }
  });

  // 更新角色
  const updateMutation = useApiMutation((data: any) => httpClient.post("/roles/update", data), {
    onSuccess: () => {
      message.success("更新成功");
      setUpdateModalOpen(false);
      actionRef.current?.reload();
    },
    onError: () => {
      message.error("更新失败");
    }
  });

  // 删除角色
  const deleteMutation = useApiMutation((id: string) => httpClient.post("/roles/delete", { id }), {
    onSuccess: () => {
      message.success("删除成功");
      actionRef.current?.reload();
    },
    onError: () => {
      message.error("删除失败");
    }
  });

  // 批量删除
  const batchDeleteMutation = useApiMutation(
    (ids: string[]) => httpClient.post("/roles/batch-delete", { ids }),
    {
      onSuccess: () => {
        message.success("批量删除成功");
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      },
      onError: () => {
        message.error("批量删除失败");
      }
    }
  );

  // 更新角色权限
  const updatePermissionsMutation = useApiMutation(
    (data: { roleId: string; menuIds: string[]; abilityIds: string[] }) =>
      httpClient.post("/roles/update-permissions", data),
    {
      onSuccess: () => {
        message.success("权限更新成功");
        setPermissionModalOpen(false);
        actionRef.current?.reload();
      },
      onError: () => {
        message.error("权限更新失败");
      }
    }
  );

  // 处理权限数据
  const handlePermissionData = () => {
    if (roleMenusData?.data) {
      setSelectedMenuKeys(roleMenusData.data.map((menu: any) => menu.id));
    }
    if (roleAbilitiesData?.data) {
      setSelectedAbilityIds(roleAbilitiesData.data.map((ability: any) => ability.id));
    }
  };

  // 表格列定义
  const columns: ProColumns<Role>[] = [
    {
      title: "角色名称",
      dataIndex: "name",
      width: 150,
      render: (_, record) => (
        <Space>
          {roleTypeConfig[record.type].icon}
          <span>{record.name}</span>
          {record.isDefault && <Tag color="green">默认</Tag>}
        </Space>
      )
    },
    {
      title: "角色编码",
      dataIndex: "code",
      width: 120,
      copyable: true
    },
    {
      title: "角色类型",
      dataIndex: "type",
      width: 100,
      valueType: "select",
      valueEnum: {
        SYSTEM: { text: "系统角色", status: "Error" },
        CUSTOM: { text: "自定义角色", status: "Processing" }
      },
      render: (_, record) => (
        <Tag color={roleTypeConfig[record.type].color} icon={roleTypeConfig[record.type].icon}>
          {roleTypeConfig[record.type].label}
        </Tag>
      )
    },
    {
      title: "角色级别",
      dataIndex: "level",
      width: 100,
      sorter: true,
      render: text => <Badge count={text} style={{ backgroundColor: "#52c41a" }} />
    },
    {
      title: "数据权限",
      dataIndex: "dataScope",
      width: 150,
      valueType: "select",
      valueEnum: Object.fromEntries(
        Object.entries(dataScopeConfig).map(([key, value]) => [key, { text: value.label }])
      ),
      render: (_, record) => (
        <Tooltip title={dataScopeConfig[record.dataScope].description}>
          <Tag color={dataScopeConfig[record.dataScope].color}>
            {dataScopeConfig[record.dataScope].label}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: "描述",
      dataIndex: "description",
      width: 200,
      ellipsis: true,
      hideInSearch: true
    },
    {
      title: "使用情况",
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Tooltip title="用户数">
            <Tag icon={<TeamOutlined />}>{record._count?.userRoles || 0}</Tag>
          </Tooltip>
          <Tooltip title="菜单数">
            <Tag icon={<MenuOutlined />}>{record._count?.menus || 0}</Tag>
          </Tooltip>
          <Tooltip title="权限数">
            <Tag icon={<KeyOutlined />}>{record._count?.abilities || 0}</Tag>
          </Tooltip>
        </Space>
      )
    },
    {
      title: "状态",
      dataIndex: "isActive",
      width: 80,
      valueType: "select",
      valueEnum: {
        true: { text: "启用", status: "Success" },
        false: { text: "禁用", status: "Error" }
      },
      render: (_, record) => (
        <Tag color={record.isActive ? "success" : "error"}>{record.isActive ? "启用" : "禁用"}</Tag>
      )
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      valueType: "dateTime",
      width: 160,
      hideInSearch: true,
      sorter: true
    },
    {
      title: "操作",
      valueType: "option",
      width: 240,
      fixed: "right",
      render: (_, record) => [
        <Button
          key="permission"
          type="link"
          size="small"
          icon={<SafetyOutlined />}
          onClick={() => {
            setCurrentRow(record);
            setPermissionModalOpen(true);
            handlePermissionData();
          }}
        >
          权限
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalOpen(true);
          }}
          disabled={record.isSystem}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此角色吗？"
          description={
            record._count?.userRoles && record._count.userRoles > 0
              ? `此角色有 ${record._count.userRoles} 个用户在使用！`
              : undefined
          }
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText="确定"
          cancelText="取消"
          disabled={record.isSystem || record.isDefault}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={record.isSystem || record.isDefault}
          >
            删除
          </Button>
        </Popconfirm>
      ]
    }
  ];

  // 基础表单项
  const baseFormItems = (
    <>
      <ProFormText
        name="name"
        label="角色名称"
        placeholder="请输入角色名称"
        rules={[{ required: true, message: "请输入角色名称" }]}
      />
      <ProFormText
        name="code"
        label="角色编码"
        placeholder="请输入角色编码"
        rules={[
          { required: true, message: "请输入角色编码" },
          {
            pattern: /^[A-Z][A-Z0-9_]*$/,
            message: "只能包含大写字母、数字和下划线，且以大写字母开头"
          }
        ]}
        disabled={updateModalOpen}
      />
      <ProFormRadio.Group
        name="type"
        label="角色类型"
        rules={[{ required: true, message: "请选择角色类型" }]}
        options={[
          { label: "系统角色", value: "SYSTEM", disabled: !currentRow?.isSystem },
          { label: "自定义角色", value: "CUSTOM" }
        ]}
        disabled={updateModalOpen}
      />
      <ProFormDigit
        name="level"
        label="角色级别"
        placeholder="请输入角色级别（数字越小权限越大）"
        tooltip="数字越小权限越大，如：超级管理员为1，普通用户为100"
        fieldProps={{ min: 1, max: 999 }}
        rules={[{ required: true, message: "请输入角色级别" }]}
      />
      <ProFormSelect
        name="dataScope"
        label="数据权限"
        placeholder="请选择数据权限范围"
        rules={[{ required: true, message: "请选择数据权限范围" }]}
        options={Object.entries(dataScopeConfig).map(([key, value]) => ({
          label: (
            <Space>
              <span>{value.label}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {value.description}
              </Text>
            </Space>
          ),
          value: key
        }))}
      />
      <ProFormTextArea
        name="description"
        label="角色描述"
        placeholder="请输入角色描述"
        fieldProps={{ rows: 3 }}
      />
      <ProFormSwitch name="isActive" label="是否启用" initialValue={true} />
      <ProFormSwitch name="isDefault" label="默认角色" tooltip="新用户注册时自动分配此角色" />
    </>
  );

  // 渲染功能权限选择
  const renderAbilities = () => {
    if (!abilitiesData?.data) return null;

    // 按模块分组
    const groupedAbilities = abilitiesData.data.reduce((acc: any, ability: Ability) => {
      if (!acc[ability.module]) {
        acc[ability.module] = [];
      }
      acc[ability.module].push(ability);
      return acc;
    }, {});

    return (
      <div>
        {Object.entries(groupedAbilities).map(([module, abilities]: [string, any]) => (
          <Card key={module} size="small" title={module} style={{ marginBottom: 16 }}>
            <ProFormCheckbox.Group
              name={`abilities_${module}`}
              options={(abilities as Ability[]).map(ability => ({
                label: (
                  <Space>
                    <span>{ability.name}</span>
                    <Tag color="blue">{ability.code}</Tag>
                    {ability.description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({ability.description})
                      </Text>
                    )}
                  </Space>
                ),
                value: ability.id
              }))}
              fieldProps={{
                value: selectedAbilityIds.filter(id =>
                  (abilities as Ability[]).some(a => a.id === id)
                ),
                onChange: values => {
                  const otherModuleIds = selectedAbilityIds.filter(
                    id => !(abilities as Ability[]).some(a => a.id === id)
                  );
                  setSelectedAbilityIds([...otherModuleIds, ...(values as string[])]);
                }
              }}
            />
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ProCard>
      <Alert
        message="角色管理说明"
        description="角色是权限的集合，通过给用户分配角色来控制用户的访问权限。系统角色不可删除，默认角色会在新用户注册时自动分配。角色级别用于控制角色之间的权限大小，数字越小权限越大。"
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <ProTable<Role>
        columns={columns}
        actionRef={actionRef}
        request={async (params, sort, filter) => {
          const { data, code } = await httpClient.post("/roles/list", {
            ...params,
            ...filter,
            sort
          });

          return {
            data: data?.list || [],
            total: data?.total || 0,
            success: code === 200
          };
        }}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true
        }}
        search={{
          labelWidth: "auto",
          span: 6
        }}
        scroll={{ x: 1400 }}
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys as string[]),
          getCheckboxProps: record => ({
            disabled: record.isSystem || record.isDefault
          })
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true
        }}
        dateFormatter="string"
        headerTitle="角色列表"
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentRow(undefined);
              setCreateModalOpen(true);
            }}
          >
            新建角色
          </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 个角色吗？`}
              onConfirm={() => batchDeleteMutation.mutate(selectedRowKeys)}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )
        ]}
      />

      {/* 创建角色弹窗 */}
      <ModalForm
        title="新建角色"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={async values => {
          await createMutation.mutateAsync(values);
          return true;
        }}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        width={600}
      >
        {baseFormItems}
      </ModalForm>

      {/* 编辑角色弹窗 */}
      <ModalForm
        title="编辑角色"
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        onFinish={async values => {
          await updateMutation.mutateAsync({
            ...values,
            id: currentRow?.id
          });
          return true;
        }}
        initialValues={currentRow}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        width={600}
      >
        {baseFormItems}
      </ModalForm>

      {/* 权限配置弹窗 */}
      <ModalForm
        title={`配置权限 - ${currentRow?.name}`}
        open={permissionModalOpen}
        onOpenChange={visible => {
          setPermissionModalOpen(visible);
          if (visible && currentRow) {
            refetchRoleMenus();
            refetchRoleAbilities();
          }
        }}
        onFinish={async () => {
          if (!currentRow) return false;
          await updatePermissionsMutation.mutateAsync({
            roleId: currentRow.id,
            menuIds: selectedMenuKeys,
            abilityIds: selectedAbilityIds
          });
          return true;
        }}
        width={900}
        modalProps={{
          destroyOnClose: true
        }}
      >
        <Tabs
          items={[
            {
              key: "menu",
              label: (
                <span>
                  <MenuOutlined /> 菜单权限
                </span>
              ),
              children: (
                <div>
                  <Alert
                    message="选择角色可以访问的菜单"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Tree
                    checkable
                    checkStrictly
                    defaultExpandAll
                    checkedKeys={selectedMenuKeys}
                    onCheck={checkedKeys => {
                      setSelectedMenuKeys(checkedKeys as string[]);
                    }}
                    treeData={menuTreeData?.data || []}
                    height={400}
                  />
                </div>
              )
            },
            {
              key: "ability",
              label: (
                <span>
                  <KeyOutlined /> 功能权限
                </span>
              ),
              children: (
                <div>
                  <Alert
                    message="选择角色拥有的功能权限"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  {renderAbilities()}
                </div>
              )
            }
          ]}
        />
      </ModalForm>
    </ProCard>
  );
}
