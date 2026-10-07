import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AdminSidebar from '../../../components/Admin/Sidebar';
import List from './List';
import Form from './Form';
import Detail from './Detail';

const { Content } = Layout;

const Restaurants = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminSidebar selectedKey="restaurants" />
      <Layout className="site-layout" style={{ marginLeft: 200 }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div className="bg-white p-6 rounded-lg shadow">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const RestaurantRoutes = () => {
  return (
    <Routes>
      <Route element={<Restaurants />}>
        <Route index element={<List />} />
        <Route path="new" element={<Form />} />
        <Route path=":id" element={<Detail />} />
        <Route path=":id/edit" element={<Form />} />
      </Route>
    </Routes>
  );
};

export default RestaurantRoutes;
