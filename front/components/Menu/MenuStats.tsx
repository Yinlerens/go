"use client";

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag } from 'antd';
import { 
  MenuOutlined, 
  EyeOutlined, 
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  AppstoreOutlined,
  LinkOutlined,
  DesktopOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useMenuStats } from '@/hooks/useMenus';
import { MenuType } from '@/types/menu';

const MenuStats: React.FC = () => {
  const { data: stats, isLoading } = useMenuStats();

  if (!stats?.data) {
    return null;
  }

  const { total, visible, hidden, enabled, disabled, byType } = stats.data;

  // 计算百分比
  const visiblePercent = total > 0 ? Math.round((visible / total) * 100) : 0;
  const enabledPercent = total > 0 ? Math.round((enabled / total) * 100) : 0;

  // 菜单类型配置
  const typeConfig = {
    [MenuType.MENU]: {
      icon: <MenuOutlined />,
      color: '#1890ff',
      name: '菜单'
    },
    [MenuType.BUTTON]: {
      icon: <AppstoreOutlined />,
      color: '#52c41a',
      name: '按钮'
    },
    [MenuType.IFRAME]: {
      icon: <DesktopOutlined />,
      color: '#fa8c16',
      name: '内嵌页面'
    },
    [MenuType.EXTERNAL]: {
      icon: <LinkOutlined />,
      color: '#722ed1',
      name: '外部链接'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Row gutter={[16, 16]}>
        {/* 总体统计 */}
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-lg">
            <Statistic
              title="菜单总数"
              value={total}
              prefix={<MenuOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-lg">
            <Statistic
              title="显示菜单"
              value={visible}
              prefix={<EyeOutlined />}
              suffix={`/ ${total}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={visiblePercent} 
              size="small" 
              strokeColor="#52c41a"
              className="mt-2"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-lg">
            <Statistic
              title="隐藏菜单"
              value={hidden}
              prefix={<EyeInvisibleOutlined />}
              suffix={`/ ${total}`}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Progress 
              percent={100 - visiblePercent} 
              size="small" 
              strokeColor="#ff4d4f"
              className="mt-2"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-lg">
            <Statistic
              title="启用菜单"
              value={enabled}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${total}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={enabledPercent} 
              size="small" 
              strokeColor="#52c41a"
              className="mt-2"
            />
          </Card>
        </Col>

        {/* 按类型统计 */}
        <Col xs={24}>
          <Card 
            title="按类型统计" 
            className="shadow-lg"
          >
            <Row gutter={[16, 16]}>
              {Object.entries(byType).map(([type, count]) => {
                const config = typeConfig[type as MenuType];
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                
                return (
                  <Col xs={24} sm={12} md={6} key={type}>
                    <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div 
                        className="text-3xl mb-2"
                        style={{ color: config.color }}
                      >
                        {config.icon}
                      </div>
                      <div className="text-2xl font-bold mb-1" style={{ color: config.color }}>
                        {count}
                      </div>
                      <div className="text-gray-500 mb-2">
                        {config.name}
                      </div>
                      <Progress 
                        percent={percent} 
                        size="small" 
                        strokeColor={config.color}
                        format={() => `${percent}%`}
                      />
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>

        {/* 状态分布 */}
        <Col xs={24} md={12}>
          <Card 
            title="显示状态分布" 
            className="shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EyeOutlined style={{ color: '#52c41a' }} />
                  <span>显示</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{visible}</span>
                  <Tag color="green">{visiblePercent}%</Tag>
                </div>
              </div>
              <Progress 
                percent={visiblePercent} 
                strokeColor="#52c41a"
                trailColor="#f5f5f5"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EyeInvisibleOutlined style={{ color: '#ff4d4f' }} />
                  <span>隐藏</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{hidden}</span>
                  <Tag color="red">{100 - visiblePercent}%</Tag>
                </div>
              </div>
              <Progress 
                percent={100 - visiblePercent} 
                strokeColor="#ff4d4f"
                trailColor="#f5f5f5"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="启用状态分布" 
            className="shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>启用</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{enabled}</span>
                  <Tag color="green">{enabledPercent}%</Tag>
                </div>
              </div>
              <Progress 
                percent={enabledPercent} 
                strokeColor="#52c41a"
                trailColor="#f5f5f5"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <StopOutlined style={{ color: '#ff4d4f' }} />
                  <span>禁用</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{disabled}</span>
                  <Tag color="red">{100 - enabledPercent}%</Tag>
                </div>
              </div>
              <Progress 
                percent={100 - enabledPercent} 
                strokeColor="#ff4d4f"
                trailColor="#f5f5f5"
              />
            </div>
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default MenuStats;
