import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
  Form,
  Image,
} from 'react-bootstrap';
import { FaShoppingBag, FaDollarSign, FaStar, FaUtensils } from 'react-icons/fa';
import api, { authAPI, orderAPI } from '../../services/api';

const storageBase = (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000/storage').replace(/\/$/, '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^storage\/?/i, '').replace(/^\//, '');
  return `${storageBase}/${normalized}`;
};

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalMenuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('all');
  const [ownerProfile, setOwnerProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const updateDashboardSummary = (selection, restaurantsData, ordersData, ownerInfo) => {
    const isAll = selection === 'all';
    const selectedId = isAll ? null : Number(selection);

    const filteredOrders = isAll
      ? ordersData
      : ordersData.filter((order) => Number(order.restaurant_id) === selectedId);

    const selectedRestaurant = isAll
      ? null
      : restaurantsData.find((rest) => Number(rest.id) === selectedId) || null;

    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + Number(order.total || order.total_amount || 0),
      0
    );

    const totalMenuItems = isAll
      ? restaurantsData.reduce(
          (sum, rest) =>
            sum + (rest.menu_items?.length || rest.menuItems?.length || 0),
          0
        )
      : (selectedRestaurant?.menu_items?.length || selectedRestaurant?.menuItems?.length || 0);

    const averageRating = isAll
      ? (restaurantsData.length
          ? restaurantsData.reduce(
              (ratingSum, rest) => ratingSum + Number(rest.rating || 0),
              0
            ) / restaurantsData.length
          : 0)
      : Number(selectedRestaurant?.rating || 0);

    setStats({
      totalOrders: filteredOrders.length,
      totalRevenue,
      averageRating,
      totalMenuItems,
    });

    const info = isAll
      ? {
          id: 'all',
          name: 'All Restaurants',
          address: 'Multiple locations',
          phone: ownerInfo?.phone || '—',
          email: ownerInfo?.email || '—',
          delivery_fee: null,
          delivery_time: null,
          minimum_order: null,
        }
      : selectedRestaurant;

    setRestaurant(info);
    setRecentOrders(filteredOrders.slice(0, 10));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileResponse, activeOrdersResponse] = await Promise.all([
        authAPI.getMe(),
        orderAPI.getActive(),
      ]);

      const ownerData = profileResponse.data?.data;
      const ownerRestaurants = ownerData?.restaurants || [];

      setOwnerProfile(ownerData);

      if (!ownerRestaurants.length) {
        setRestaurant(null);
        setRestaurants([]);
        setOrders([]);
        setRecentOrders([]);
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalMenuItems: 0,
        });
        setError('No restaurants found for your account. Please contact admin.');
        return;
      }

      const restaurantDetails = await Promise.all(
        ownerRestaurants.map(async (rest) => {
          try {
            const detailResponse = await api.get(`/restaurants/${rest.id}`);
            return detailResponse.data?.data || rest;
          } catch (detailError) {
            console.warn('Failed to load detailed restaurant info', detailError);
            return rest;
          }
        })
      );

      const ordersRaw = activeOrdersResponse.data?.data || [];
      const restaurantIds = restaurantDetails.map((rest) => Number(rest.id));

      const ownerOrders = ordersRaw
        .filter((order) => restaurantIds.includes(Number(order.restaurant_id)))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const initialSelection = restaurantDetails.length > 1 ? 'all' : String(restaurantDetails[0].id);

      setRestaurants(restaurantDetails);
      setOrders(ownerOrders);
      setSelectedRestaurantId(initialSelection);

      updateDashboardSummary(initialSelection, restaurantDetails, ownerOrders, ownerData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      console.error('Error details:', err.response?.data);
      setError(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = (event) => {
    const value = event.target.value;
    setSelectedRestaurantId(value);
    updateDashboardSummary(value, restaurants, orders, ownerProfile);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      picked_up: 'secondary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status ? status.replace(/_/g, ' ') : 'unknown'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!restaurants.length) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          You don't have a restaurant yet. Please contact admin to set up your restaurant.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1 className="fw-bold mb-2">Restaurant Owner Dashboard</h1>
          <p className="text-muted mb-0">
            Managing: <strong>{restaurant?.name}</strong>
          </p>
        </div>
        <div className="mt-3 mt-md-0">
          <Button variant="outline-primary" onClick={fetchDashboardData} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Form.Group controlId="ownerRestaurantFilter">
            <Form.Label>Select Restaurant</Form.Label>
            <Form.Select value={selectedRestaurantId} onChange={handleRestaurantChange}>
              {restaurants.length > 1 && <option value="all">All Restaurants</option>}
              {restaurants.map((rest) => (
                <option key={rest.id} value={rest.id}>
                  {rest.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h3 className="fw-bold mb-0">{stats.totalOrders}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FaShoppingBag className="text-primary" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Total Revenue</p>
                  <h3 className="fw-bold mb-0">${Number(stats.totalRevenue).toFixed(2)}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FaDollarSign className="text-success" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Average Rating</p>
                  <h3 className="fw-bold mb-0">{Number(stats.averageRating).toFixed(1)} ⭐</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FaStar className="text-warning" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1">Menu Items</p>
                  <h3 className="fw-bold mb-0">{stats.totalMenuItems}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <FaUtensils className="text-info" size={24} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Restaurant Info */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Restaurant Information</h5>
              {selectedRestaurantId === 'all' ? (
                <Row>
                  <Col md={6}>
                    <p><strong>Restaurants Managed:</strong> {restaurants.length}</p>
                    <ul className="mb-0 ps-3">
                      {restaurants.map((rest) => (
                        <li key={`rest-${rest.id}`}>{rest.name}</li>
                      ))}
                    </ul>
                  </Col>
                  <Col md={6}>
                    <p><strong>Owner Phone:</strong> {ownerProfile?.phone || 'N/A'}</p>
                    <p><strong>Owner Email:</strong> {ownerProfile?.email || 'N/A'}</p>
                    <p><strong>Average Rating:</strong> {Number(stats.averageRating || 0).toFixed(1)} ⭐</p>
                  </Col>
                </Row>
              ) : (
                <Row>
                  <Col md={6}>
                    <p><strong>Address:</strong> {restaurant?.address || 'N/A'}</p>
                    <p><strong>Phone:</strong> {restaurant?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {restaurant?.email || 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Delivery Fee:</strong> ${Number(restaurant?.delivery_fee || 0).toFixed(2)}</p>
                    <p><strong>Delivery Time:</strong> {restaurant?.delivery_time ? `${restaurant.delivery_time} mins` : 'N/A'}</p>
                    <p><strong>Minimum Order:</strong> ${Number(restaurant?.minimum_order || 0).toFixed(2)}</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Recent Orders</h5>
              {recentOrders.length === 0 ? (
                <p className="text-muted mb-0">No active orders yet</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.order_number || order.id}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>
                          {order.items?.reduce((count, item) => count + (item.quantity || 0), 0) ||
                            order.items?.length ||
                            0}{' '}
                          items
                        </td>
                        <td>${Number(order.total || order.total_amount || 0).toFixed(2)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {restaurant && restaurant.menu_items?.length > 0 && (
        <Row className="mt-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-3">Menu Items</h5>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurant.menu_items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              rounded
                              fluid
                              style={{ width: '64px', height: '48px', objectFit: 'cover' }}
                            />
                          ) : getImageUrl(item.image) ? (
                            <Image
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              rounded
                              fluid
                              style={{ width: '64px', height: '48px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '64px', height: '48px' }}>
                              <span className="text-muted small">No image</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">{item.name}</div>
                          {item.description && (
                            <div className="text-muted small text-truncate" style={{ maxWidth: '260px' }}>
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="text-muted small">{item.category?.name || 'Uncategorised'}</td>
                        <td>${Number(item.price).toFixed(2)}</td>
                        <td>
                          <Badge bg={item.is_available ? 'success' : 'secondary'}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default OwnerDashboard;
