import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Form, Input, Button, Select, InputNumber, Upload, message, Card, Space, Spin } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { restaurantAPI, adminAPI } from 'services/api';

const { TextArea } = Input;
const { Option } = Select;

const RestaurantForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [owners, setOwners] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Always fetch owners first
        await fetchOwners();
        
        // Only fetch restaurant data if we're in edit mode (id exists)
        if (id && id !== 'new') {
          console.log('Loading restaurant data for ID:', id);
          await fetchRestaurant();
        } else {
          console.log('Creating new restaurant - skipping initial fetch');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in initial data loading:', error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [id]);

  const fetchOwners = async () => {
    try {
      console.log('Fetching owners...');
      setLoadingOwners(true);
      
      // Try to get all users first
      let allUsers = [];
      try {
        const allUsersResponse = await adminAPI.getUsers({ per_page: 100 }); // Increased per_page to get all users
        console.log('All users response:', allUsersResponse);
        
        // Handle paginated response
        if (allUsersResponse?.data?.success) {
          if (Array.isArray(allUsersResponse.data.data?.data)) {
            // Handle Laravel pagination format: { data: { data: [], ...pagination } }
            allUsers = allUsersResponse.data.data.data;
          } else if (Array.isArray(allUsersResponse.data.data)) {
            // Handle direct array response
            allUsers = allUsersResponse.data.data;
          } else if (allUsersResponse.data.data) {
            // Handle single object response
            allUsers = [allUsersResponse.data.data];
          }
        }
      } catch (error) {
        console.error('Error fetching all users:', error);
      }
      
      // Try to get owners with role filter
      let ownersData = [];
      try {
        const response = await adminAPI.getUsers({ role: 'owner', per_page: 100 });
        console.log('Owners API response:', response);
        
        // Handle paginated response
        if (response?.data?.success) {
          if (Array.isArray(response.data.data?.data)) {
            // Handle Laravel pagination format: { data: { data: [], ...pagination } }
            ownersData = response.data.data.data;
          } else if (Array.isArray(response.data.data)) {
            // Handle direct array response
            ownersData = response.data.data;
          } else if (response.data.data) {
            // Handle single object response
            ownersData = [response.data.data];
          }
        }
      } catch (error) {
        console.error('Error fetching owners:', error);
      }
      
      console.log('Processed owners data:', ownersData);
      
      // If no owners found with role filter, try to find any user that could be an owner
      if (ownersData.length === 0 && allUsers.length > 0) {
        console.log('No owners found with role filter, checking all users for potential owners...');
        ownersData = allUsers.filter(user => {
          const userRole = user.role?.toLowerCase();
          const userName = user.name?.toLowerCase() || '';
          const userEmail = user.email?.toLowerCase() || '';
          
          return (
            userRole === 'owner' || 
            userRole === 'admin' ||
            userName.includes('admin') ||
            userEmail.includes('admin')
          );
        });
        console.log('Potential owners from all users:', ownersData);
      }
      
      // If still no owners, use the first available user
      if (ownersData.length === 0 && allUsers.length > 0) {
        console.log('No owners found, using first available user');
        ownersData = [allUsers[0]];
      }
      
      // Find a default owner (John or first available)
      let defaultOwner = ownersData.find(owner => 
        (owner.name && owner.name.toLowerCase().includes('john')) || 
        (owner.email && owner.email.toLowerCase().includes('john'))
      );
      
      // If John not found, use the first available owner
      if (!defaultOwner && ownersData.length > 0) {
        defaultOwner = ownersData[0];
        console.log('Using first available owner as default:', defaultOwner);
      }
      
      // Set the default owner if we found one
      if (defaultOwner && !isEditMode) {
        console.log('Setting default owner:', defaultOwner);
        // Try different possible ID fields
        const ownerId = defaultOwner.id || defaultOwner._id || defaultOwner.user_id || defaultOwner.userId;
        if (ownerId) {
          form.setFieldsValue({
            owner_id: ownerId.toString()
          });
        } else {
          console.warn('Could not determine owner ID for:', defaultOwner);
        }
      } else if (!defaultOwner) {
        console.warn('No owners found in the system');
      }
      
      setOwners(ownersData);
      setLoadingOwners(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to fetch restaurant owners';
      message.error(errorMsg);
      console.error('Error fetching owners:', error);
      setOwners([]); // Ensure owners is always an array even on error
      setLoadingOwners(false);
    }
  };

  const fetchRestaurant = async () => {
    if (!id) {
      console.log('No ID provided, skipping fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching restaurant with ID:', id);
      
      let response;
      try {
        // First try the admin API
        response = await adminAPI.getRestaurant(id);
        console.log('Admin API response:', response);
      } catch (adminError) {
        console.warn('Admin API failed, trying public API:', adminError);
        // Fall back to public API
        response = await restaurantAPI.getById(id);
        console.log('Public API response:', response);
      }
      
      // Handle different response formats
      const responseData = response?.data;
      const restaurantData = responseData?.data || responseData;
      
      if (!restaurantData) {
        throw new Error('No restaurant data received');
      }
      
      console.log('Setting form values with:', restaurantData);
      
      // Set form fields with proper defaults
      const formValues = {
        name: restaurantData.name || '',
        description: restaurantData.description || '',
        address: restaurantData.address || '',
        phone: restaurantData.phone || '',
        email: restaurantData.email || '',
        owner_id: restaurantData.owner_id?.toString() || '',
        status: restaurantData.status || 'active',
        opening_hours: restaurantData.opening_hours || '',
        delivery_fee: restaurantData.delivery_fee || 0,
        min_order: restaurantData.min_order || 0,
        is_featured: restaurantData.is_featured || false,
        cuisines: Array.isArray(restaurantData.cuisines) ? restaurantData.cuisines : [],
        latitude: restaurantData.latitude || '',
        longitude: restaurantData.longitude || '',
      };
      
      console.log('Setting form values:', formValues);
      form.setFieldsValue(formValues);
      
      // Set image URLs if they exist - check both image and image_url fields
      const logoUrl = restaurantData.image || restaurantData.image_url;
      const coverUrl = restaurantData.cover_image || restaurantData.cover_image_url;
      
      if (logoUrl) {
        const fullLogoUrl = getFullImageUrl(logoUrl);
        setImageUrl(fullLogoUrl);
        form.setFieldsValue({
          image: [{
            uid: '-1',
            name: 'restaurant-logo',
            status: 'done',
            url: fullLogoUrl,
            response: { url: fullLogoUrl } // Ensure response is set for re-uploads
          }]
        });
      }
      
      if (coverUrl) {
        const fullCoverUrl = getFullImageUrl(coverUrl);
        setCoverImageUrl(fullCoverUrl);
        form.setFieldsValue({
          cover_image: [{
            uid: '-2',
            name: 'restaurant-cover',
            status: 'done',
            url: fullCoverUrl,
            response: { url: fullCoverUrl } // Ensure response is set for re-uploads
          }]
        });
      }
      
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load restaurant data';
      message.error(errorMessage);
      navigate('/admin/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      console.log('Form values:', values);
      
      const formData = new FormData();
      
      // Format values before appending to FormData
      const formattedValues = {
        ...values,
        // Convert boolean values to 1/0 for the server
        is_featured: values.is_featured ? 1 : 0,
        // Ensure numeric fields are properly formatted
        delivery_fee: parseFloat(values.delivery_fee) || 0,
        minimum_order: parseFloat(values.minimum_order) || 0,
        delivery_time: parseInt(values.delivery_time, 10) || 30,
        // Ensure owner_id is an integer
        owner_id: parseInt(values.owner_id, 10) || 1
      };
      
      // Append all form values to FormData
      Object.entries(formattedValues).forEach(([key, value]) => {
        // Skip undefined, null, and empty strings for optional fields
        if (value !== undefined && value !== null && value !== '') {
          // Handle file uploads (for both image and cover_image)
          if ((key === 'image' || key === 'cover_image') && Array.isArray(value) && value[0]) {
            const fileInfo = value[0];
            // If it's a file upload, append the file
            if (fileInfo.originFileObj) {
              formData.append(key, fileInfo.originFileObj);
            } else if (fileInfo.url) {
              // If it's an existing image URL, include it in the form data
              formData.append(`${key}_url`, fileInfo.url);
            } else if (fileInfo.response?.url) {
              // If the response contains a URL, use that
              formData.append(`${key}_url`, fileInfo.response.url);
            }
          }
          // Handle array fields (like cuisines)
          else if (Array.isArray(value)) {
            value.forEach(item => {
              if (item && typeof item === 'object') {
                formData.append(`${key}[]`, JSON.stringify(item));
              } else if (item) {
                formData.append(`${key}[]`, item);
              }
            });
          } else {
            formData.append(key, value);
          }
        }
      });

      let response;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (isEditMode && id) {
        // For updates, use POST with _method=PUT for Laravel
        formData.append('_method', 'PUT');
        response = await adminAPI.updateRestaurant(id, formData, config);
      } else {
        // For new restaurant
        response = await adminAPI.createRestaurant(formData, config);
      }

      if (response && response.data) {
        const restaurantId = response.data.data?.id || id;
        message.success(isEditMode ? 'Restaurant updated successfully' : 'Restaurant created successfully');
        navigate(`/admin/restaurants/${restaurantId}`);
      } else {
        throw new Error(response?.data?.message || 'Failed to save restaurant');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to save restaurant. Please check the form and try again.';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }
    return true;
  };
  
  // Helper to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return '';
    // If it's already a full URL, return as is
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    // Check if it's a relative URL (starts with /)
    if (url.startsWith('/')) {
      // Remove any duplicate slashes that might cause issues
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      return `${baseUrl}${url}`;
    }
    // Otherwise, prepend the storage URL
    const storageUrl = process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000/storage';
    return `${storageUrl}/${url.replace(/^\//, '')}`;
  };

  const uploadButton = (isCover = false) => (
    <div>
      <div className="ant-upload-text">
        {isCover ? 'Upload Cover Image' : 'Upload Logo'}
      </div>
    </div>
  );

  const handleImageChange = (info) => {
    console.log('Image upload status:', info.file.status, info);
    
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        // Check if the response contains the URL
        let imageUrl = '';
        
        // Handle different response formats
        if (info.file.response?.data?.url) {
          imageUrl = info.file.response.data.url;
        } else if (info.file.response?.url) {
          imageUrl = info.file.response.url;
        } else if (info.file.response) {
          // If the response is just the URL string
          imageUrl = info.file.response;
        } else if (info.file.originFileObj) {
          // Create a blob URL if no server URL is provided
          imageUrl = URL.createObjectURL(info.file.originFileObj);
        }
        
        console.log('Image uploaded successfully:', imageUrl);
        setImageUrl(imageUrl);
        
        // Update the form value with the new image
        form.setFieldsValue({
          image: [{
            ...info.file,
            uid: info.file.uid || `-${Date.now()}`,
            name: info.file.name || 'image.jpg',
            status: 'done',
            url: imageUrl,
            response: info.file.response || { url: imageUrl }
          }]
        });
        
        message.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error processing image upload:', error);
        message.error('Error processing image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (info.file.status === 'error') {
      console.error('Image upload failed:', info.file.error);
      message.error('Failed to upload image. Please try again.');
      setLoading(false);
    }
  };

  const handleCoverImageChange = (info) => {
    console.log('Cover image upload status:', info.file.status, info);
    
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        // Check if the response contains the URL
        let imageUrl = '';
        
        // Handle different response formats
        if (info.file.response?.data?.url) {
          imageUrl = info.file.response.data.url;
        } else if (info.file.response?.url) {
          imageUrl = info.file.response.url;
        } else if (info.file.originFileObj) {
          // Create a blob URL if no server URL is provided
          imageUrl = URL.createObjectURL(info.file.originFileObj);
        }
        
        console.log('Cover image uploaded successfully:', imageUrl);
        setCoverImageUrl(imageUrl);
        
        // Update the form value with the new image
        form.setFieldsValue({
          cover_image: [{
            ...info.file,
            uid: info.file.uid,
            name: info.file.name,
            status: 'done',
            url: imageUrl,
            response: info.file.response || { url: imageUrl }
          }]
        });
        
        message.success('Cover image uploaded successfully');
      } catch (error) {
        console.error('Error processing cover image upload:', error);
        message.error('Error processing cover image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (info.file.status === 'error') {
      console.error('Cover image upload failed:', info.file.error);
      message.error('Failed to upload cover image. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}
        </h1>
      </div>

      <Card loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            is_featured: false,
            delivery_fee: 0,
            minimum_order: 0,
            delivery_time: 30,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              
              <Form.Item
                name="owner_id"
                label="Owner"
                rules={[{ required: true, message: 'Please select an owner' }]}
              >
                <Select
                  placeholder={loadingOwners ? 'Loading owners...' : 'Select owner'}
                  showSearch
                  optionFilterProp="children"
                  loading={loadingOwners}
                  notFoundContent={loadingOwners ? 'Loading...' : 'No owners found'}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() || '').includes(input.toLowerCase()) ?? false
                  }
                >
                  {Array.isArray(owners) && owners.map(owner => {
                    // Safely get owner properties with fallbacks
                    const ownerId = owner?.id || owner?._id || '';
                    const ownerName = owner?.name || 'Unnamed User';
                    const ownerEmail = owner?.email || 'No email';
                    
                    return (
                      <Option 
                        key={ownerId.toString()} 
                        value={ownerId.toString()}
                      >
                        {`${ownerName} (${ownerEmail})`}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label="Restaurant Name"
                rules={[{ required: true, message: 'Please enter restaurant name' }]}
              >
                <Input placeholder="Enter restaurant name" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea rows={4} placeholder="Enter restaurant description" />
              </Form.Item>

              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="is_featured"
                label="Featured"
                valuePropName="checked"
              >
                <Select>
                  <Option value={1}>Yes</Option>
                  <Option value={0}>No</Option>
                </Select>
              </Form.Item>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter address' }]}
              >
                <TextArea rows={2} placeholder="Enter full address" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="latitude"
                  label="Latitude"
                  rules={[{ required: true, message: 'Please enter latitude' }]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="e.g. 40.7128"
                    step="0.000001"
                  />
                </Form.Item>

                <Form.Item
                  name="longitude"
                  label="Longitude"
                  rules={[{ required: true, message: 'Please enter longitude' }]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="e.g. -74.0060"
                    step="0.000001"
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Form.Item
                name="delivery_fee"
                label="Delivery Fee"
                rules={[{ required: true, message: 'Please enter delivery fee' }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Form.Item
                name="minimum_order"
                label="Minimum Order"
                rules={[{ required: true, message: 'Please enter minimum order amount' }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>

              <Form.Item
                name="delivery_time"
                label="Delivery Time (minutes)"
                rules={[{ required: true, message: 'Please enter estimated delivery time' }]}
              >
                <Space.Compact className="w-full">
                  <InputNumber
                    className="w-full"
                    min={0}
                  />
                  <Button>min</Button>
                </Space.Compact>
              </Form.Item>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                name="image"
                label="Restaurant Logo"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  name="image"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  action={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/upload`}
                  beforeUpload={beforeUpload}
                  onChange={handleImageChange}
                  headers={{
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                  }}
                  withCredentials={true}
                  data={{
                    _token: document.querySelector('meta[name="csrf-token"]')?.content || '',
                    type: 'restaurant_image'
                  }}
                >
                  {imageUrl ? (
                    <img 
                      src={getFullImageUrl(imageUrl)} 
                      alt="Restaurant Logo" 
                      style={{ width: '100%', maxHeight: '100%', objectFit: 'cover' }} 
                    />
                  ) : uploadButton()}
                </Upload>
              </Form.Item>

              <Form.Item
                name="cover_image"
                label="Cover Image"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  name="cover_image"
                  listType="picture-card"
                  className="cover-uploader"
                  showUploadList={false}
                  action={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/upload`}
                  beforeUpload={beforeUpload}
                  onChange={handleCoverImageChange}
                  headers={{
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                  }}
                  withCredentials={true}
                  data={{
                    _token: document.querySelector('meta[name="csrf-token"]')?.content || '',
                    type: 'restaurant_cover'
                  }}
                >
                  {coverImageUrl ? (
                    <img 
                      src={getFullImageUrl(coverImageUrl)} 
                      alt="Cover" 
                      style={{ width: '100%', maxHeight: '100%', objectFit: 'cover' }} 
                    />
                  ) : uploadButton(true)}
                </Upload>
              </Form.Item>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button onClick={() => navigate('/admin/restaurants')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
            >
              {isEditMode ? 'Update Restaurant' : 'Create Restaurant'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RestaurantForm;
