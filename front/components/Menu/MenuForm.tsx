"use client";

import React, { useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Switch, 
  InputNumber, 
  TreeSelect, 
  Space, 
  Button,
  Card,
  Row,
  Col,
  Divider
} from 'antd';
import { motion } from 'framer-motion';
import { Menu, MenuType, MenuTarget, CreateMenuRequest, UpdateMenuRequest } from '@/types/menu';
import { useMenuTree } from '@/hooks/useMenus';
import DynamicIcon from '@/components/icon/DynamicIcon';

const { Option } = Select;
const { TextArea } = Input;

interface MenuFormProps {
  menu?: Menu;
  onSubmit: (data: CreateMenuRequest | UpdateMenuRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const MenuForm: React.FC<MenuFormProps> = ({
  menu,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { data: menuTree, isLoading: treeLoading } = useMenuTree(true, true);

  // 表单初始化
  useEffect(() => {
    if (menu) {
      form.setFieldsValue({
        name: menu.name,
        title: menu.title,
        subtitle: menu.subtitle,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        parentId: menu.parentId,
        type: menu.type,
        target: menu.target,
        sort: menu.sort,
        isVisible: menu.isVisible,
        isEnabled: menu.isEnabled,
        requireAuth: menu.requireAuth,
        permissions: menu.permissions
      });
    } else {
      // 新建时的默认值
      form.setFieldsValue({
        type: MenuType.MENU,
        target: MenuTarget.SELF,
        sort: 0,
        isVisible: true,
        isEnabled: true,
        requireAuth: true,
        permissions: []
      });
    }
  }, [menu, form]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (menu) {
        // 更新菜单
        onSubmit({ id: menu.id, ...values } as UpdateMenuRequest);
      } else {
        // 创建菜单
        onSubmit(values as CreateMenuRequest);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 转换菜单树为TreeSelect数据
  const convertToTreeData = (menus: any[]): any[] => {
    return menus.map(menu => ({
      title: menu.title,
      value: menu.id,
      key: menu.id,
      children: menu.children ? convertToTreeData(menu.children) : undefined
    }));
  };

  // 菜单类型选项
  const menuTypeOptions = [
    { label: '菜单', value: MenuType.MENU },
    { label: '按钮', value: MenuType.BUTTON },
    { label: '内嵌页面', value: MenuType.IFRAME },
    { label: '外部链接', value: MenuType.EXTERNAL }
  ];

  // 打开方式选项
  const targetOptions = [
    { label: '当前窗口', value: MenuTarget.SELF },
    { label: '新窗口', value: MenuTarget.BLANK },
    { label: '父窗口', value: MenuTarget.PARENT },
    { label: '顶级窗口', value: MenuTarget.TOP }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        title={menu ? '编辑菜单' : '新建菜单'}
        className="shadow-lg"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="菜单名称"
                rules={[
                  { required: true, message: '请输入菜单名称' },
                  { max: 100, message: '菜单名称不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入菜单名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="菜单标题"
                rules={[
                  { required: true, message: '请输入菜单标题' },
                  { max: 100, message: '菜单标题不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入菜单标题" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="菜单类型"
                rules={[{ required: true, message: '请选择菜单类型' }]}
              >
                <Select placeholder="请选择菜单类型">
                  {menuTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parentId"
                label="父菜单"
              >
                <TreeSelect
                  placeholder="请选择父菜单"
                  allowClear
                  treeData={menuTree ? convertToTreeData(menuTree.data) : []}
                  loading={treeLoading}
                  treeDefaultExpandAll
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="path"
                label="路由路径"
              >
                <Input placeholder="如: /admin/users" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="component"
                label="组件路径"
              >
                <Input placeholder="如: admin/users/page" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="icon"
                label="图标"
              >
                <Input placeholder="如: user" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="subtitle"
            label="菜单副标题"
          >
            <Input placeholder="请输入菜单副标题（可选）" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="target"
                label="打开方式"
              >
                <Select placeholder="请选择打开方式">
                  {targetOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="sort"
                label="排序"
              >
                <InputNumber 
                  placeholder="排序值" 
                  min={0} 
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div className="space-y-4">
                <Form.Item
                  name="isVisible"
                  label="是否显示"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="isEnabled"
                  label="是否启用"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="requireAuth"
                  label="需要认证"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Divider />

          <div className="flex justify-end space-x-4">
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              {menu ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Card>
    </motion.div>
  );
};

export default MenuForm;
