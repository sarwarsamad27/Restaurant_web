import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI, notificationAPI } from '../../services/api';
import { FaUsers, FaStore, FaShoppingBag, FaDollarSign, FaStar } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);
  const shownAlertsRef = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();

    fetchAdminAlerts();
    pollingRef.current = setInterval(fetchAdminAlerts, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  };

  const fetchAdminAlerts = async () => {
    try {
      const response = await notificationAPI.getUnread();
      const alerts = response.data.data?.filter((notification) => notification.type === 'admin_alert') || [];

      if (!alerts.length) {
        return;
      }

      await Promise.all(
        alerts.map(async (alert) => {
          if (shownAlertsRef.current.has(alert.id)) {
            return;
          }

          toast.info(alert.message || 'Driver accepted an order', {
            toastId: `admin-alert-${alert.id}`,
          });

          shownAlertsRef.current.add(alert.id);
          try {
            await notificationAPI.markAsRead(alert.id);
          } catch (markErr) {
            console.error('Failed to mark notification as read', markErr);
          }
        })
      );
    } catch (error) {
      console.error('Failed to load admin alerts', error);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner-border" /></div>;

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <h1 className="fw-bold mb-2 mb-md-0">Admin Dashboard</h1>
        <Button variant="outline-primary" size="sm" onClick={fetchDashboard}>
          Refresh Stats
        </Button>
      </div>
      <Row className="g-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Users</p>
                  <h3 className="fw-bold">{formatNumber(stats?.total_users)}</h3>
                </div>
                <FaUsers size={40} className="text-primary" />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button size="sm" variant="outline-primary" onClick={() => navigate('/admin/users')}>
                  Manage Users
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Restaurants</p>
                  <h3 className="fw-bold">{formatNumber(stats?.total_restaurants)}</h3>
                </div>
                <FaStore size={40} className="text-success" />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button size="sm" variant="outline-success" onClick={() => navigate('/admin/restaurants')}>
                  View Restaurants
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Orders</p>
                  <h3 className="fw-bold">{formatNumber(stats?.total_orders)}</h3>
                </div>
                <FaShoppingBag size={40} className="text-info" />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button size="sm" variant="outline-info" onClick={() => navigate('/admin/orders')}>
                  Review Orders
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Revenue</p>
                  <h3 className="fw-bold">${formatNumber(stats?.total_revenue).toFixed(2)}</h3>
                </div>
                <FaDollarSign size={40} className="text-warning" />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button size="sm" variant="outline-warning" onClick={() => navigate('/admin/orders')}>
                  View Reports
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Community Ratings</p>
                  <h3 className="fw-bold">Insights</h3>
                </div>
                <FaStar size={40} className="text-danger" />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button size="sm" variant="outline-danger" onClick={() => navigate('/admin/restaurant-ratings')}>
                  View Ratings
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
