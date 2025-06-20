"use client";

import { useState, useRef, useEffect } from "react";
import {
  ProTable,
  ProColumns,
  ActionType,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormSwitch,
  ModalForm,
  ProFormRadio,
  ProCard,
  ProFormTreeSelect
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
  Table
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MenuOutlined,
  FolderOutlined,
  FileTextOutlined,
  LinkOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { httpClient } from "@/lib/http-client";
import {
  Menu,
  FolderOpen,
  FileText,
  ExternalLink,
  Layers,
  Hash,
  Eye,
  EyeOff,
  Settings2,
  MoreVertical
} from "lucide-react";
type MenuType = "DIRECTORY" | "MENU" | "BUTTON" | "EXTERNAL";
// 菜单类型配置
const menuTypeConfig: Record<MenuType, { label: string; icon: React.ReactNode; color: string }> = {
  DIRECTORY: { label: "目录", icon: <FolderOutlined />, color: "blue" },
  MENU: { label: "菜单", icon: <FileTextOutlined />, color: "green" },
  BUTTON: { label: "按钮", icon: <AppstoreOutlined />, color: "orange" },
  EXTERNAL: { label: "外链", icon: <LinkOutlined />, color: "purple" }
};

// 菜单数据类型
interface MenuItem {
  id: string;
  name: string;
  code: string;
  type: MenuType;
  path?: string;
  component?: string;
  redirect?: string;
  title: string;
  icon?: string;
  badge?: string;
  parentId?: string;
  level: number;
  sort: number;
  meta?: any;
  permission?: string;
  isVisible: boolean;
  isActive: boolean;
  isCache: boolean;
  isAffix: boolean;
  createdAt: string;
  updatedAt: string;
  children?: MenuItem[];
}

// 图标选择器组件
const IconSelector: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value, onChange }) => {
  const icons = [
    { key: "dashboard", icon: <Layers size={16} />, label: "仪表盘" },
    { key: "system", icon: <Settings2 size={16} />, label: "系统" },
    { key: "user", icon: <Menu size={16} />, label: "用户" },
    { key: "role", icon: <Menu size={16} />, label: "角色" },
    { key: "menu", icon: <Menu size={16} />, label: "菜单" },
    { key: "department", icon: <Menu size={16} />, label: "部门" },
    { key: "ability", icon: <Menu size={16} />, label: "权限" },
    { key: "audit", icon: <FileText size={16} />, label: "审计" },
    { key: "database", icon: <Menu size={16} />, label: "数据库" }
  ];

  return (
    <ProFormSelect
      name="icon"
      label="菜单图标"
      placeholder="请选择图标"
      options={icons.map(item => ({
        label: (
          <Space>
            {item.icon}
            {item.label}
          </Space>
        ),
        value: item.key
      }))}
      fieldProps={{
        value,
        onChange
      }}
    />
  );
};

export default function MenuManagementPage() {
  const actionRef = useRef<ActionType>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<MenuItem>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [tableData, setTableData] = useState<MenuItem[]>([]);
  // 获取菜单列表
  const { refetch: refetchMenus } = useApiQuery(
    ["menus"],
    "/menus/list",
    {},
    {
      enabled: false
    }
  );

  // 获取菜单树
  const { data: menuTreeData, refetch: refetchMenuTree } = useApiQuery(
    ["menu-tree"],
    "/menus/tree",
    {},
    {
      enabled: true
    }
  );

  // 创建菜单
  const createMutation = useApiMutation((data: any) => httpClient.post("/menus/create", data), {
    onSuccess: () => {
      message.success("创建成功");
      setCreateModalOpen(false);
      actionRef.current?.reload();
      refetchMenuTree();
    },
    onError: () => {
      message.error("创建失败");
    }
  });

  // 更新菜单
  const updateMutation = useApiMutation((data: any) => httpClient.post("/menus/update", data), {
    onSuccess: () => {
      message.success("更新成功");
      setUpdateModalOpen(false);
      actionRef.current?.reload();
      refetchMenuTree();
    },
    onError: () => {
      message.error("更新失败");
    }
  });

  // 删除菜单
  const deleteMutation = useApiMutation((id: string) => httpClient.post("/menus/delete", { id }), {
    onSuccess: () => {
      message.success("删除成功");
      actionRef.current?.reload();
      refetchMenuTree();
    },
    onError: () => {
      message.error("删除失败");
    }
  });

  // 批量删除
  const batchDeleteMutation = useApiMutation(
    (ids: string[]) => httpClient.post("/menus/batch-delete", { ids }),
    {
      onSuccess: () => {
        message.success("批量删除成功");
        setSelectedRowKeys([]);
        actionRef.current?.reload();
        refetchMenuTree();
      },
      onError: () => {
        message.error("批量删除失败");
      }
    }
  );

  // 更新排序
  const updateSortMutation = useApiMutation(
    (data: { id: string; parentId?: string; sort: number }) =>
      httpClient.post("/menus/update-sort", data),
    {
      onSuccess: () => {
        message.success("排序更新成功");
        actionRef.current?.reload();
      }
    }
  );

  // 表格列定义
  const columns: ProColumns<MenuItem>[] = [
    {
      title: "菜单名称",
      dataIndex: "name",
      width: 200,
      fixed: "left",
      render: (_, record) => (
        <Space>
          {menuTypeConfig[record.type].icon}
          <span>{record.name}</span>
          {record.badge && <Badge count={record.badge} style={{ marginLeft: 8 }} />}
        </Space>
      )
    },
    {
      title: "菜单标题",
      dataIndex: "title",
      width: 150,
      ellipsis: true
    },
    {
      title: "菜单类型",
      dataIndex: "type",
      width: 100,
      valueType: "select",
      valueEnum: {
        DIRECTORY: { text: "目录", status: "Processing" },
        MENU: { text: "菜单", status: "Success" },
        BUTTON: { text: "按钮", status: "Warning" },
        EXTERNAL: { text: "外链", status: "Default" }
      },
      render: (_, record) => (
        <Tag color={menuTypeConfig[record.type].color}>{menuTypeConfig[record.type].label}</Tag>
      )
    },
    {
      title: "菜单编码",
      dataIndex: "code",
      width: 120,
      copyable: true,
      ellipsis: true
    },
    {
      title: "路由路径",
      dataIndex: "path",
      width: 180,
      ellipsis: true,
      copyable: true,
      render: (_, record) => {
        if (record.type === "EXTERNAL") {
          return (
            <a href={record.path} target="_blank" rel="noopener noreferrer">
              {record.path} <LinkOutlined />
            </a>
          );
        }
        return record.path || "-";
      }
    },
    {
      title: "组件路径",
      dataIndex: "component",
      width: 200,
      ellipsis: true,
      copyable: true,
      hideInSearch: true
    },
    {
      title: "权限标识",
      dataIndex: "permission",
      width: 150,
      ellipsis: true,
      render: text => (text ? <Tag color="blue">{text}</Tag> : "-")
    },
    {
      title: "排序",
      dataIndex: "sort",
      width: 80,
      hideInSearch: true,
      sorter: true
    },
    {
      title: "状态",
      width: 280,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title={record.isVisible ? "显示" : "隐藏"}>
            <Tag color={record.isVisible ? "success" : "default"}>
              {record.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            </Tag>
          </Tooltip>
          <Tooltip title={record.isActive ? "启用" : "禁用"}>
            <Tag color={record.isActive ? "success" : "error"}>
              {record.isActive ? "启用" : "禁用"}
            </Tag>
          </Tooltip>
          <Tooltip title={record.isCache ? "缓存" : "不缓存"}>
            <Tag color={record.isCache ? "processing" : "default"}>缓存</Tag>
          </Tooltip>
          <Tooltip title={record.isAffix ? "固定" : "不固定"}>
            <Tag color={record.isAffix ? "warning" : "default"}>固定</Tag>
          </Tooltip>
        </Space>
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
      width: 180,
      fixed: "right",
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalOpen(true);
          }}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除此菜单吗？"
          description={
            record.children && record.children.length > 0 ? "删除后，子菜单也会被删除！" : undefined
          }
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
        <Dropdown
          key="more"
          menu={{
            items: [
              {
                key: "addChild",
                label: "添加子菜单",
                icon: <PlusOutlined />,
                onClick: () => {
                  setCurrentRow({
                    ...record,
                    parentId: record.id,
                    id: ""
                  } as any);
                  setCreateModalOpen(true);
                }
              },
              {
                key: "copy",
                label: "复制菜单",
                icon: <EditOutlined />,
                onClick: () => {
                  const newData = { ...record };
                  delete (newData as any).id;
                  delete newData.children;
                  newData.name = `${record.name}-副本`;
                  newData.code = `${record.code}_copy`;
                  createMutation.mutate(newData);
                }
              }
            ]
          }}
        >
          <Button type="link" size="small" icon={<MoreVertical size={14} />} />
        </Dropdown>
      ]
    }
  ];

  // 表单基础字段
  const baseFormItems = (
    <>
      <ProFormTreeSelect
        name="parentId"
        label="上级菜单"
        placeholder="请选择上级菜单"
        allowClear
        fieldProps={{
          treeData: Array.isArray(menuTreeData?.data) ? menuTreeData.data : [],
          fieldNames: {
            label: "title",
            value: "id"
          },
          showSearch: true,
          treeNodeFilterProp: "title"
        }}
      />
      <ProFormText
        name="name"
        label="菜单名称"
        placeholder="请输入菜单名称"
        rules={[{ required: true, message: "请输入菜单名称" }]}
      />
      <ProFormText
        name="title"
        label="菜单标题"
        placeholder="请输入菜单标题（支持i18n）"
        rules={[{ required: true, message: "请输入菜单标题" }]}
      />
      <ProFormText
        name="code"
        label="菜单编码"
        placeholder="请输入菜单编码"
        rules={[
          { required: true, message: "请输入菜单编码" },
          {
            pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            message: "只能包含字母、数字和下划线，且以字母开头"
          }
        ]}
      />
      <ProFormRadio.Group
        name="type"
        label="菜单类型"
        radioType="button"
        rules={[{ required: true, message: "请选择菜单类型" }]}
        options={[
          { label: "目录", value: "DIRECTORY" },
          { label: "菜单", value: "MENU" },
          { label: "按钮", value: "BUTTON" },
          { label: "外链", value: "EXTERNAL" }
        ]}
      />
      <ProFormText
        name="path"
        label="路由路径"
        placeholder="请输入路由路径"
        rules={[{ required: true, message: "请输入路由路径" }]}
      />
      <ProFormText
        name="component"
        label="组件路径"
        placeholder="请输入组件路径，如：@/views/system/menu/index"
      />
      <ProFormText name="redirect" label="重定向路径" placeholder="请输入重定向路径" />
      <IconSelector />
      <ProFormText name="badge" label="徽标" placeholder="请输入徽标内容" />
      <ProFormText
        name="permission"
        label="权限标识"
        placeholder="请输入权限标识，如：system:menu:list"
      />
      <ProFormDigit
        name="sort"
        label="排序"
        placeholder="请输入排序号"
        fieldProps={{ min: 0 }}
        initialValue={0}
      />
      <ProFormSwitch name="isVisible" label="是否显示" initialValue={true} />
      <ProFormSwitch name="isActive" label="是否启用" initialValue={true} />
      <ProFormSwitch name="isCache" label="是否缓存" initialValue={false} />
      <ProFormSwitch name="isAffix" label="是否固定" initialValue={false} />
    </>
  );

  return (
    <ProCard>
      <Alert
        message="菜单管理说明"
        description="支持多级菜单配置，可通过拖拽调整菜单顺序和层级关系。目录类型只用于分组，菜单类型对应实际页面，按钮类型用于页面内权限控制，外链类型用于跳转外部链接。"
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <ProTable<MenuItem>
        columns={columns}
        actionRef={actionRef}
        request={async (params, sort, filter) => {
          const { data, code } = await httpClient.post("/menus/list", {
            ...params,
            ...filter,
            sort
          });

          const list = data?.list || [];
          setTableData(list); // 保存数据到状态

          return {
            data: list,
            total: data?.total || 0,
            success: code === 200
          };
        }}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true
        }}
        search={{
          labelWidth: "auto",
          span: 6
        }}
        scroll={{ x: 1800 }}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: keys => setExpandedRowKeys(keys as string[])
        }}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
          preserveSelectedRowKeys: true,
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys as string[])
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true
        }}
        dateFormatter="string"
        headerTitle="菜单列表"
        toolBarRender={() => [
          <Button
            key="expand"
            onClick={() => {
              const allKeys = tableData.map(item => item.id);
              setExpandedRowKeys(expandedRowKeys.length === 0 ? allKeys : []);
            }}
          >
            {expandedRowKeys.length === 0 ? "展开全部" : "收起全部"}
          </Button>,
          <Button
            type="primary"
            key="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentRow(undefined);
              setCreateModalOpen(true);
            }}
          >
            新建菜单
          </Button>,
          selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定要删除选中的 ${selectedRowKeys.length} 个菜单吗？`}
              onConfirm={() => batchDeleteMutation.mutate(selectedRowKeys)}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )
        ]}
      />

      {/* 创建菜单弹窗 */}
      <ModalForm
        title="新建菜单"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={async values => {
          await createMutation.mutateAsync(values);
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

      {/* 编辑菜单弹窗 */}
      <ModalForm
        title="编辑菜单"
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        onFinish={async values => {
          await updateMutation.mutateAsync({
            ...values,
            id: currentRow?.id
          });
          return true;
        }}
        // initialValues={currentRow}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        width={600}
      >
        {baseFormItems}
      </ModalForm>
    </ProCard>
  );
}
