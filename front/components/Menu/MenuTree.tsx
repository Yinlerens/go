"use client";

import React, { useState } from 'react';
import { 
  Tree, 
  Card, 
  Button, 
  Space, 
  Input, 
  Switch, 
  Tooltip, 
  Tag,
  Dropdown,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  MoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DragOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Menu, MenuTreeNode, MenuType } from '@/types/menu';
import { useMenuTree, useDeleteMenu, useUpdateMenu } from '@/hooks/useMenus';
import DynamicIcon from '@/components/icon/DynamicIcon';
import type { DataNode, TreeProps } from 'antd/es/tree';

const { Search } = Input;

interface MenuTreeProps {
  onEdit: (menu: Menu) => void;
  onAdd: (parentId?: string) => void;
}

const MenuTree: React.FC<MenuTreeProps> = ({ onEdit, onAdd }) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const { data: menuTree, isLoading } = useMenuTree(includeHidden, includeDisabled);
  const deleteMenuMutation = useDeleteMenu();
  const updateMenuMutation = useUpdateMenu();

  // 转换菜单树为Ant Design Tree组件需要的格式
  const convertToTreeData = (nodes: MenuTreeNode[]): DataNode[] => {
    return nodes.map(node => ({
      key: node.id,
      title: renderTreeNode(node),
      children: node.children ? convertToTreeData(node.children) : undefined,
      isLeaf: !node.children || node.children.length === 0
    }));
  };

  // 渲染树节点
  const renderTreeNode = (menu: MenuTreeNode) => {
    const getTypeTag = (type: MenuType) => {
      const typeConfig = {
        [MenuType.MENU]: { color: 'blue', text: '菜单' },
        [MenuType.BUTTON]: { color: 'green', text: '按钮' },
        [MenuType.IFRAME]: { color: 'orange', text: '内嵌' },
        [MenuType.EXTERNAL]: { color: 'purple', text: '外链' }
      };
      
      const config = typeConfig[type];
      return <Tag color={config.color} size="small">{config.text}</Tag>;
    };

    const menuItems = [
      {
        key: 'add',
        label: '添加子菜单',
        icon: <PlusOutlined />,
        onClick: () => onAdd(menu.id)
      },
      {
        key: 'edit',
        label: '编辑',
        icon: <EditOutlined />,
        onClick: () => onEdit(menu)
      },
      {
        key: 'toggle-visibility',
        label: menu.isVisible ? '隐藏' : '显示',
        icon: menu.isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />,
        onClick: () => handleToggleVisibility(menu)
      },
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDelete(menu.id)
      }
    ];

    return (
      <div className="flex items-center justify-between w-full group">
        <div className="flex items-center space-x-2 flex-1">
          {menu.icon && (
            <DynamicIcon name={menu.icon as any} className="w-4 h-4" />
          )}
          <span className={`${!menu.isVisible ? 'text-gray-400 line-through' : ''}`}>
            {menu.title}
          </span>
          {getTypeTag(menu.type)}
          {!menu.isEnabled && (
            <Tag color="red" size="small">禁用</Tag>
          )}
          {menu.requireAuth && (
            <Tag color="orange" size="small">需认证</Tag>
          )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Space size="small">
            <Tooltip title="快速切换显示/隐藏">
              <Button
                type="text"
                size="small"
                icon={menu.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleVisibility(menu);
                }}
                loading={updateMenuMutation.isPending}
              />
            </Tooltip>
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        </div>
      </div>
    );
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value && menuTree) {
      // 展开包含搜索结果的节点
      const expandedKeys = getExpandedKeys(menuTree, value);
      setExpandedKeys(expandedKeys);
      setAutoExpandParent(true);
    } else {
      setExpandedKeys([]);
      setAutoExpandParent(false);
    }
  };

  // 获取需要展开的节点
  const getExpandedKeys = (nodes: MenuTreeNode[], searchValue: string): string[] => {
    const keys: string[] = [];
    
    const traverse = (nodes: MenuTreeNode[], parentKeys: string[] = []) => {
      nodes.forEach(node => {
        const currentKeys = [...parentKeys, node.id];
        
        if (node.title.toLowerCase().includes(searchValue.toLowerCase()) ||
            node.name.toLowerCase().includes(searchValue.toLowerCase())) {
          keys.push(...parentKeys);
        }
        
        if (node.children) {
          traverse(node.children, currentKeys);
        }
      });
    };
    
    traverse(nodes);
    return [...new Set(keys)];
  };

  // 处理删除
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个菜单吗？删除后不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        deleteMenuMutation.mutate(id);
      }
    });
  };

  // 快速切换可见性
  const handleToggleVisibility = (menu: Menu) => {
    updateMenuMutation.mutate({
      id: menu.id,
      isVisible: !menu.isVisible
    });
  };

  // 树组件事件处理
  const onExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue as string[]);
    setAutoExpandParent(false);
  };

  const treeData = menuTree ? convertToTreeData(menuTree.data!) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        title="菜单树形结构"
        className="shadow-lg"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onAdd()}
          >
            新建根菜单
          </Button>
        }
      >
        {/* 搜索和筛选 */}
        <div className="mb-4 space-y-3">
          <Search
            placeholder="搜索菜单"
            allowClear
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                size="small"
                checked={includeHidden}
                onChange={setIncludeHidden}
              />
              <span className="text-sm">显示隐藏菜单</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                size="small"
                checked={includeDisabled}
                onChange={setIncludeDisabled}
              />
              <span className="text-sm">显示禁用菜单</span>
            </div>
          </div>
        </div>

        {/* 树形结构 */}
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onExpand={onExpand}
          loading={isLoading}
          showLine={{ showLeafIcon: false }}
          className="menu-tree"
        />
      </Card>
    </motion.div>
  );
};

export default MenuTree;
