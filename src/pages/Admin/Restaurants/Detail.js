import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Space, Tabs, Table, message, Popconfirm, Select, Spin, Modal, Form, Input, InputNumber, Switch } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { Image } from 'antd';
import { restaurantAPI, adminAPI, reviewAPI, categoryAPI, menuItemAPI } from 'services/api';

const { TabPane } = Tabs;

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  
  const handleEdit = useCallback(() => {
    if (restaurant?.id) {
      navigate(`/admin/restaurants/${restaurant.id}/edit`);
    }
  }, [navigate, restaurant?.id]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Calculate discounted price based on price, discount value and type
  const calculateDiscountedPrice = (price, discountValue, discountType) => {
    const priceNum = parseFloat(price) || 0;
    const discount = parseFloat(discountValue) || 0;
    
    if (discountType === 'percentage') {
      return (priceNum * (1 - discount / 100)).toFixed(2);
    } else {
      return Math.max(0, priceNum - discount).toFixed(2);
    }
  };

  // Handle menu item deletion
  const handleDeleteMenu = async (menuItemId) => {
    try {
      setLoading(true);
      await adminAPI.deleteMenuItem(id, menuItemId);
      message.success('Menu item deleted successfully');
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      message.error('Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  // Handle menu form submission
  const handleMenuSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'discount') {
            formData.append('discount_value', value.value || 0);
            formData.append('discount_type', value.type || 'percentage');
          } else if (key === 'is_available') {
            formData.append(key, value ? '1' : '0');
          } else {
            formData.append(key, value);
          }
        }
      });

      if (currentMenuItem) {
        // Update existing menu item
        await adminAPI.updateMenuItem(id, currentMenuItem.id, formData);
        message.success('Menu item updated successfully');
      } else {
        // Create new menu item
        await adminAPI.createMenuItem(id, formData);
        message.success('Menu item created successfully');
      }

      // Refresh menu items and close modal
      await fetchMenuItems();
      setIsMenuModalVisible(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      message.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't show error message to avoid confusion since this is a public endpoint
      setCategories([]);
    }
  }, []);

  const fetchRestaurant = useCallback(async () => {
    if (!isMounted || !id) return;
    
    try {
      console.log('Fetching restaurant with ID:', id);
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        // First try the admin API endpoint
        let response;
        try {
          response = await adminAPI.getRestaurant(id, { signal: controller.signal });
          console.log('Admin API response:', response);
        } catch (adminError) {
          console.warn('Admin API failed, trying public API:', adminError);
          // Fall back to public API if admin endpoint fails
          response = await restaurantAPI.getById(id, { signal: controller.signal });
          console.log('Public API response:', response);
        }
        
        if (!isMounted) return;
        
        console.log('Restaurant data received:', response?.data);
        
        // Handle different response formats
        const responseData = response?.data;
        if (!responseData) {
          throw new Error('No data received from server');
        }
        
        // Handle different response structures
        const restaurantData = responseData?.data?.data || responseData?.data || responseData;
        
        if (!restaurantData) {
          throw new Error('Invalid restaurant data format');
        }
        
        console.log('Setting restaurant data:', restaurantData);
        setRestaurant(restaurantData);
        
        // If we have menu items in the response, set them
        if (restaurantData.menu_items || restaurantData.menu) {
          setMenuItems(restaurantData.menu_items || restaurantData.menu || []);
        }
        
      } finally {
        clearTimeout(timeoutId);
      }
      
    } catch (error) {
      if (!isMounted) return;
      
      console.error('Error in fetchRestaurant:', error);
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timed out. Please try again.' 
        : error.response?.data?.message || error.message || 'Failed to fetch restaurant details';
      
      setError(errorMessage);
      message.error(errorMessage);
      
      if (error.response?.status === 404) {
        message.error('Restaurant not found. Redirecting to list...');
        setTimeout(() => navigate('/admin/restaurants'), 2000);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [id, navigate, isMounted]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchCategories();
    }
  }, [fetchRestaurant, fetchCategories, id]);

  // Initial fetch
  useEffect(() => {
    if (isMounted) {
      console.log('Component mounted or ID changed, fetching restaurant...');
      fetchRestaurant();
    }
    
    // Cleanup function
    return () => {
      console.log('Cleaning up...');
    };
  }, [fetchRestaurant, isMounted]);

  // Tab change handler
  const handleTabChange = useCallback((key) => {
    console.log('Tab changed to:', key);
    setActiveTab(key);
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (!restaurant) {
      console.log('No restaurant data yet, skipping tab data fetch');
      return;
    }

    console.log('Active tab changed or restaurant loaded, fetching data for tab:', activeTab);
    
    const fetchTabData = async () => {
      try {
        switch (activeTab) {
          case 'menu':
            await fetchMenuItems();
            break;
          case 'orders':
            await fetchOrders();
            break;
          case 'reviews':
            await fetchReviews();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error fetching data for tab ${activeTab}:`, error);
      }
    };

    fetchTabData();
  }, [activeTab, restaurant]);

  const fetchMenuItems = useCallback(async () => {
    try {
      console.log('Fetching menu items for restaurant:', id);
      const response = await adminAPI.getRestaurantMenuItems(id);
      
      // Safely extract and validate menu items
      let items = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          items = response.data.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Handle case where data is a single object instead of array
          items = [response.data];
        }
      }
      
      console.log('Processed menu items:', items);
      setMenuItems(items);
      return items;
    } catch (error) {
      console.error('Error in fetchMenuItems:', error);
      message.error('Failed to fetch menu items');
      setMenuItems([]);
      return [];
    }
  }, [id]);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('Fetching orders for restaurant:', id);
      const { data } = await adminAPI.getOrders({ restaurant_id: id });
      console.log('Orders received:', data);
      setOrders(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      message.error('Failed to fetch orders');
      setOrders([]);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      console.log('Fetching reviews for restaurant:', id);
      const { data } = await reviewAPI.getRestaurantReviews(id);
      console.log('Reviews received:', data);
      setReviews(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      message.error('Failed to fetch reviews');
      setReviews([]);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await adminAPI.deleteRestaurant(id);
      message.success('Restaurant deleted successfully');
      navigate('/admin/restaurants');
    } catch (error) {
      message.error('Failed to delete restaurant');
      console.error('Error deleting restaurant:', error);
    }
  };

  const handleEditMenu = (menuItem) => {
    console.log('Editing menu item:', menuItem);
    setCurrentMenuItem(menuItem);
    
    // Set image preview if available
    if (menuItem.image_url) {
      setImagePreview(menuItem.image_url);
    }
    
    // Prepare form values
    const formValues = {
      name: menuItem.name,
      description: menuItem.description || '',
      price: parseFloat(menuItem.price) || 0,
      category_id: menuItem.category?.id || menuItem.category_id,
      is_available: Boolean(menuItem.is_available),
      discount: {
        value: 0,
        type: 'percentage'
      }
    };
    
    // Handle discount values
    const discountValue = menuItem.discount_value || (menuItem.discount?.value);
    const discountType = menuItem.discount_type || (menuItem.discount?.type) || 'percentage';
    
    if (discountValue > 0) {
      formValues.discount = {
        value: parseFloat(discountValue),
        type: discountType
      };
    }
    
    console.log('Setting form values:', formValues);
    
    // Reset form and set new values
    form.resetFields();
    form.setFieldsValue(formValues);
    
    // Open the modal
    setIsMenuModalVisible(true);
  };

  const menuColumns = [
    {
      title: 'Image',
      dataIndex: 'image_url',
      key: 'image',
      width: 80,
      render: (image) => {
        if (!image) {
          return (
            <div style={{
              width: 50,
              height: 50,
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4
            }}>
              <PictureOutlined />
            </div>
          );
        }
        
        return (
          <Image 
            src={image} 
            alt="Menu item" 
            width={50} 
            height={50} 
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback={
              <div style={{
                width: 50,
                height: 50,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}>
                <PictureOutlined />
              </div>
            }
          />
        );
      }
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.description && (
            <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              {record.description.length > 50 
                ? `${record.description.substring(0, 50)}...` 
                : record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => {
        const hasDiscount = record.discount_value > 0 || (record.discount?.value > 0);
        const discountValue = record.discount_value || (record.discount?.value) || 0;
        const discountType = record.discount_type || (record.discount?.type) || 'percentage';
        
        return (
          <div>
            {hasDiscount ? (
              <div>
                <div style={{ textDecoration: 'line-through', color: '#999' }}>
                  ${(Number(price) || 0).toFixed(2)}
                </div>
                <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                  ${calculateDiscountedPrice(price, discountValue, discountType)}
                </div>
                <div style={{ color: '#52c41a', fontSize: 12 }}>
                  {discountType === 'percentage' 
                    ? `${discountValue}% OFF` 
                    : `$${discountValue} OFF`}
                </div>
              </div>
            ) : (
              <div>${(Number(price) || 0).toFixed(2)}</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: 'Status',
      dataIndex: 'is_available',
      key: 'status',
      render: (isAvailable) => (
        <Tag color={isAvailable ? 'green' : 'red'}>
          {isAvailable ? 'Available' : 'Unavailable'}
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
            onClick={(e) => {
              e.stopPropagation();
              handleEditMenu(record);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this menu item?"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteMenu(record.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="p-0"
        >
          Back to Restaurants
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Menu Items" key="menu">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Menu Items</h2>
              <Button 
                type="primary" 
                onClick={() => {
                  setCurrentMenuItem(null);
                  form.resetFields();
                  setImagePreview('');
                  setImageFile(null);
                  setIsMenuModalVisible(true);
                }}
              >
                Add Menu Item
              </Button>
            </div>
            
            <Table 
              columns={menuColumns} 
              dataSource={menuItems}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </div>
        </TabPane>
      </Tabs>

      <Modal
        title={currentMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        open={isMenuModalVisible}
        onCancel={() => setIsMenuModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleMenuSubmit}
          initialValues={{
            is_available: true,
            discount: { value: 0, type: 'percentage' }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: 'Please enter menu item name' }]}
            >
              <Input placeholder="Enter menu item name" size="large" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                size="large"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select 
                placeholder="Select a category" 
                loading={categories.length === 0}
                size="large"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {categories.map(category => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="is_available"
              label=" "
              className="flex items-end"
              valuePropName="checked"
            >
              <div className="flex items-center h-10">
                <span className="mr-2 text-gray-700">Available</span>
                <Switch />
              </div>
            </Form.Item>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button onClick={() => setIsMenuModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {currentMenuItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RestaurantDetail;
