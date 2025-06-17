"use client";

import React from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { 
  MenuOutlined, 
  UserOutlined, 
  SettingOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

const { Title, Paragraph } = Typography;

const AdminDashboard: React.FC = () => {
  const quickActions = [
    {
      title: '菜单管理',
      description: '管理系统菜单结构和权限',
      icon: <MenuOutlined className="text-2xl text-blue-500" />,
      href: '/admin/menus',
      color: 'border-blue-200 hover:border-blue-400'
    },
    {
      title: '用户管理',
      description: '管理系统用户和角色',
      icon: <UserOutlined className="text-2xl text-green-500" />,
      href: '/admin/users',
      color: 'border-green-200 hover:border-green-400'
    },
    {
      title: '系统设置',
      description: '配置系统参数和选项',
      icon: <SettingOutlined className="text-2xl text-orange-500" />,
      href: '/admin/settings',
      color: 'border-orange-200 hover:border-orange-400'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 欢迎区域 */}
      <Card className="shadow-lg">
        <div className="text-center py-8">
          <DashboardOutlined className="text-6xl text-blue-500 mb-4" />
          <Title level={2} className="mb-2">
            欢迎来到管理后台
          </Title>
          <Paragraph className="text-gray-600 text-lg">
            这里是系统管理中心，您可以管理菜单、用户、权限等系统功能
          </Paragraph>
        </div>
      </Card>

      {/* 快速操作 */}
      <Card title="快速操作" className="shadow-lg">
        <Row gutter={[24, 24]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card
                    hoverable
                    className={`h-full border-2 transition-all duration-300 ${action.color}`}
                  >
                    <div className="text-center space-y-4">
                      <div>{action.icon}</div>
                      <div>
                        <Title level={4} className="mb-2">
                          {action.title}
                        </Title>
                        <Paragraph className="text-gray-600 mb-0">
                          {action.description}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 系统信息 */}
      <Card title="系统信息" className="shadow-lg">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">1.0.0</div>
              <div className="text-gray-600">系统版本</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">在线</div>
              <div className="text-gray-600">系统状态</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">React 19</div>
              <div className="text-gray-600">前端框架</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">Next.js 15</div>
              <div className="text-gray-600">应用框架</div>
            </div>
          </Col>
        </Row>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
