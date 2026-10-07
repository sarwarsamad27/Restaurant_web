import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AppstoreOutlined,
  StarOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const AdminSidebar = ({ selectedKey }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      key: 'restaurants',
      icon: <ShopOutlined />,
      label: 'Restaurants',
      path: '/admin/restaurants',
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
      path: '/admin/orders',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Users',
      path: '/admin/users',
    },
    {
      key: 'diet-menu',
      icon: <AppstoreOutlined />,
      label: 'Diet Menu',
      path: '/admin/diet-menu',
    },
    {
      key: 'ratings',
      icon: <StarOutlined />,
      label: 'Ratings',
      path: '/admin/restaurant-ratings',
    },
  ];

  const handleMenuClick = (item) => {
    const selected = menuItems.find(menuItem => menuItem.key === item.key);
    if (selected) {
      navigate(selected.path);
    }
  };

  const handleLogout = () => {
    // Add your logout logic here
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getSelectedKey = () => {
    const currentPath = location.pathname;
    const matchedItem = menuItems.find(item => currentPath.startsWith(item.path));
    return matchedItem ? [matchedItem.key] : [];
  };

  return (
    <Sider width={200} className="site-layout-background" theme="light">
      <div className="p-4 text-center">
        <h2 className="text-lg font-bold">Admin Panel</h2>
      </div>
      <Menu
        mode="inline"
        selectedKeys={getSelectedKey()}
        style={{ height: '100%', borderRight: 0 }}
        onClick={handleMenuClick}
        items={[
          ...menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label
          })),
          { type: 'divider' },
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            danger: true,
            onClick: handleLogout
          }
        ]}
      />
    </Sider>
  );
};

export default AdminSidebar;
