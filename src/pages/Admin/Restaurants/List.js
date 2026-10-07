import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, message, Popconfirm, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminAPI } from 'services/api';

const { Search } = Input;
const { Option } = Select;

const RestaurantList = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const fetchRestaurants = useCallback(async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      console.log('Fetching restaurants with params:', { 
        page, 
        per_page: pageSize,
        status: filters.status,
        search: filters.search 
      });
      
      const response = await adminAPI.getRestaurants({
        page,
        per_page: pageSize,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      
      console.log('API Response:', response);
      
      // The response has a data property with success and data
      const responseData = response?.data;
      
      if (!responseData) {
        throw new Error('No data received from server');
      }
      
      // The actual restaurants array is in responseData.data.data
      const restaurantsData = Array.isArray(responseData.data?.data) 
        ? responseData.data.data 
        : [];
      
      // Get pagination info
      const paginationData = responseData.data?.meta || {};
      const total = paginationData.total || 0;
      const currentPage = paginationData.current_page || page;
      
      console.log('Processed restaurants data:', {
        data: restaurantsData,
        pagination: {
          total,
          currentPage,
          pageSize: paginationData.per_page || pageSize,
          lastPage: paginationData.last_page || 1
        }
      });
      
      // Ensure each restaurant has a unique key
      const processedData = restaurantsData.map(restaurant => ({
        ...restaurant,
        key: restaurant.id || Math.random().toString(36).substr(2, 9) // Fallback key
      }));
      
      setRestaurants(processedData);
      setPagination(prev => ({
        ...prev,
        total,
        current: currentPage,
        pageSize: paginationData.per_page || pageSize,
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch restaurants';
      message.error(errorMessage);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search]);

  useEffect(() => {
    fetchRestaurants(pagination.current, pagination.pageSize);
  }, [fetchRestaurants, pagination.current, pagination.pageSize]);

  const handleTableChange = useCallback((newPagination, _, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  }, []);

  const handleDelete = useCallback(async (restaurantId) => {
    if (!restaurantId) {
      console.error('Cannot delete restaurant: No ID provided');
      message.error('Cannot delete restaurant: Invalid restaurant ID');
      return;
    }
    
    try {
      console.log('Deleting restaurant with ID:', restaurantId);
      setLoading(true);
      
      const response = await adminAPI.deleteRestaurant(restaurantId);
      console.log('Delete response:', response);
      
      // Check for successful response (200 OK)
      if (response?.status === 200 || response?.data?.message?.includes('success')) {
        message.success('Restaurant deleted successfully');
        // Refresh the list with current pagination
        await fetchRestaurants(
          restaurants.length === 1 && pagination.current > 1 
            ? Math.max(1, pagination.current - 1)  // Ensure we don't go below page 1
            : pagination.current, 
          pagination.pageSize
        );
      } else {
        throw new Error(response?.data?.message || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete restaurant';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchRestaurants, pagination, restaurants.length]);

  const handleStatusChange = useCallback(async (id, status) => {
    try {
      await adminAPI.updateRestaurantStatus(id, { status });
      message.success('Restaurant status updated successfully');
      fetchRestaurants(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to update restaurant status');
      console.error('Error updating restaurant status:', error);
    }
  }, [fetchRestaurants, pagination.current, pagination.pageSize]);

  const handleSearch = useCallback((value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  const columns = useMemo(() => [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Link to={`/admin/restaurants/${record.id}`}>
          {text || 'Unnamed Restaurant'}
        </Link>
      ),
    },
    {
      title: 'Owner',
      dataIndex: ['owner', 'name'],
      key: 'owner',
      render: (_, record) => (
        <div>
          <div>{record.owner?.name}</div>
          <div className="text-gray-500 text-xs">{record.owner?.email}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          active: { color: 'green', text: 'Active' },
          inactive: { color: 'orange', text: 'Inactive' },
          closed: { color: 'red', text: 'Closed' },
        };
        const statusInfo = statusMap[status] || { color: 'gray', text: 'Unknown' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Featured',
      dataIndex: 'is_featured',
      key: 'is_featured',
      render: (isFeatured) => (
        <Tag color={isFeatured ? 'green' : 'default'}>
          {isFeatured ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/admin/restaurants/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            onClick={() => navigate(`/admin/restaurants/${record.id}`)}
          >
            View
          </Button>
          <Popconfirm
            title={
              <>
                <div>Are you sure you want to delete this restaurant?</div>
                <div className="font-semibold mt-1">{record.name || 'Unnamed Restaurant'}</div>
                <div className="text-xs text-gray-500">This action cannot be undone.</div>
              </>
            }
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ 
              danger: true,
              loading: loading 
            }}
            placement="topRight"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
              }}
              loading={loading}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleDelete, navigate]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Link to="/admin/restaurants/new">
          <Button type="primary" icon={<PlusOutlined />}>
            Add Restaurant
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-6">
          <Search
            placeholder="Search restaurants..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="w-full md:w-1/3"
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={handleStatusFilter}
            className="w-full md:w-auto"
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="closed">Closed</Option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={restaurants}
            rowKey={(record) => record.id || record.key}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `Total ${total} restaurants`,
              position: ['bottomRight'],
            }}
            onChange={handleTableChange}
            scroll={{ x: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(RestaurantList);