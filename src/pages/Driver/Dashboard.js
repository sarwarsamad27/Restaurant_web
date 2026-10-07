import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Button, Badge, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { driverAPI } from '../../services/api';

const statusVariants = {
  pending: 'secondary',
  preparing: 'info',
  ready: 'primary',
  out_for_delivery: 'warning',
  delivered: 'success',
  cancelled: 'danger',
};

const DriverDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileRes, earningsRes, availableRes, activeRes, recentRes] = await Promise.all([
        driverAPI.getMe(),
        driverAPI.getEarnings(),
        driverAPI.getAvailableDeliveries({ per_page: 5 }),
        driverAPI.getDeliveries({ status: 'active', per_page: 5 }),
        driverAPI.getDeliveries({ status: 'delivered', per_page: 5 }),
      ]);

      setProfile(profileRes.data.data);
      setEarnings(earningsRes.data.data);
      setAvailableDeliveries(availableRes.data.data?.data || availableRes.data.data || []);
      setActiveDeliveries(activeRes.data.data?.data || []);
      setRecentDeliveries(recentRes.data.data?.data || []);
    } catch (err) {
      console.error('Failed to load driver dashboard', err);
      const message = err.response?.data?.message || 'Failed to load driver dashboard.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadDashboardData();
    };

    if (mounted) {
      init();
    }

    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusChange = async (status) => {
    if (!profile || profile.status === status) {
      return;
    }

    setStatusUpdating(true);
    try {
      await driverAPI.updateStatus({ status });
      setProfile((prev) => (prev ? { ...prev, status } : prev));
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAcceptDelivery = async (orderId) => {
    setAcceptingId(orderId);
    try {
      await driverAPI.acceptDelivery(orderId);
      toast.success('Delivery accepted. Head to the restaurant!');
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to accept delivery', err);
      toast.error(err.response?.data?.message || 'Failed to accept delivery');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    setCompletingId(orderId);
    try {
      await driverAPI.completeDelivery(orderId);
      toast.success('Delivery marked as completed. Great job!');
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to complete delivery', err);
      toast.error(err.response?.data?.message || 'Failed to complete delivery');
    } finally {
      setCompletingId(null);
    }
  };

  const earningsSummary = useMemo(() => ({
    total: Number(earnings?.total_earnings || 0),
    today: Number(earnings?.today_earnings || 0),
    week: Number(earnings?.week_earnings || 0),
    month: Number(earnings?.month_earnings || 0),
    deliveries: Number(earnings?.total_deliveries || profile?.total_deliveries || 0),
    rating: Number(profile?.rating || 0),
  }), [earnings, profile]);

  const renderDeliveryItem = (delivery, options = {}) => {
    const statusVariant = statusVariants[delivery.status] || 'secondary';
    const customerName = delivery.user?.name || 'Customer';
    const restaurantName = delivery.restaurant?.name || 'Restaurant';
    const orderTime = delivery.created_at ? new Date(delivery.created_at).toLocaleString() : '—';
    const address = delivery.delivery_address || 'N/A';
    const {
      showAccept,
      showComplete,
    } = options;

    return (
      <ListGroup.Item key={delivery.id} className="py-3">
        <Row className="align-items-center">
          <Col md={6}>
            <h6 className="mb-1">Order #{delivery.order_number || delivery.id}</h6>
            <div className="text-muted small">{restaurantName}</div>
            <div className="text-muted small">Customer: {customerName}</div>
          </Col>
          <Col md={3}>
            <div className="text-muted small">Placed: {orderTime}</div>
            <div className="text-muted small">Address: {address}</div>
          </Col>
          <Col md={3} className="text-md-end">
            <Badge bg={statusVariant} pill>
              {delivery.status?.replace('_', ' ') || 'Unknown'}
            </Badge>
            <div className="mt-2 d-flex flex-column gap-2 align-items-end">
              {showAccept && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => handleAcceptDelivery(delivery.id)}
                  disabled={acceptingId === delivery.id}
                >
                  {acceptingId === delivery.id ? 'Accepting…' : 'Accept Order'}
                </Button>
              )}
              {showComplete && (
                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={() => handleCompleteDelivery(delivery.id)}
                  disabled={completingId === delivery.id}
                >
                  {completingId === delivery.id ? 'Completing…' : 'Mark Delivered'}
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </ListGroup.Item>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3">Whoops! Something went wrong.</h3>
        <p className="text-muted mb-4">{error}</p>
        <Button onClick={loadDashboardData}>Try Again</Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3">Driver profile not found</h3>
        <p className="text-muted">Please contact support or admin for assistance.</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1">Welcome back, {profile.user?.name || 'Driver'}!</h1>
          <p className="text-muted mb-0">Here is an overview of your deliveries and earnings.</p>
        </div>
        <Button
          variant="outline-primary"
          onClick={loadDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted">Today&apos;s Earnings</h6>
              <h3 className="fw-bold">${earningsSummary.today.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted">This Week</h6>
              <h3 className="fw-bold">${earningsSummary.week.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted">This Month</h6>
              <h3 className="fw-bold">${earningsSummary.month.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted">All-Time</h6>
              <h3 className="fw-bold">${earningsSummary.total.toFixed(2)}</h3>
              <div className="text-muted small">{earningsSummary.deliveries} deliveries completed</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Current Status</h5>
                <small className="text-muted">Update your availability in real-time</small>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <Badge bg={profile.status === 'available' ? 'success' : profile.status === 'busy' ? 'warning' : 'secondary'} pill>
                  {profile.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
                {profile.is_verified ? (
                  <Badge bg="info" pill className="ms-2">
                    Verified
                  </Badge>
                ) : (
                  <Badge bg="secondary" pill className="ms-2">
                    Pending Verification
                  </Badge>
                )}
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant={profile.status === 'available' ? 'success' : 'outline-success'}
                  onClick={() => handleStatusChange('available')}
                  disabled={statusUpdating}
                >
                  Available
                </Button>
                <Button
                  variant={profile.status === 'busy' ? 'warning' : 'outline-warning'}
                  onClick={() => handleStatusChange('busy')}
                  disabled={statusUpdating}
                >
                  Busy
                </Button>
                <Button
                  variant={profile.status === 'offline' ? 'secondary' : 'outline-secondary'}
                  onClick={() => handleStatusChange('offline')}
                  disabled={statusUpdating}
                >
                  Offline
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Performance</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="text-muted small">Overall Rating</div>
                <h4 className="fw-bold mb-0">{earningsSummary.rating > 0 ? earningsSummary.rating.toFixed(1) : '—'}</h4>
              </div>
              <div className="mb-3">
                <div className="text-muted small">Completed Deliveries</div>
                <h4 className="fw-bold mb-0">{earningsSummary.deliveries}</h4>
              </div>
              <div>
                <div className="text-muted small">Vehicle</div>
                <h6 className="mb-0">{profile.vehicle_type || 'Not specified'}</h6>
                <div className="text-muted small">{profile.vehicle_number || '—'}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Quick Contact</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="text-muted small">Driver Name</div>
                <h6 className="mb-0">{profile.user?.name || '—'}</h6>
              </div>
              <div className="mb-3">
                <div className="text-muted small">Phone</div>
                <h6 className="mb-0">{profile.user?.phone || 'Not provided'}</h6>
              </div>
              <div>
                <div className="text-muted small">Email</div>
                <h6 className="mb-0">{profile.user?.email || 'Not provided'}</h6>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Active Deliveries</h5>
              <Badge bg="primary">{activeDeliveries.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {activeDeliveries.length === 0 ? (
                <div className="p-4 text-center text-muted">No active deliveries at the moment.</div>
              ) : (
                <ListGroup variant="flush">
                  {activeDeliveries.map((delivery) =>
                    renderDeliveryItem(delivery, {
                      showComplete: ['out_for_delivery', 'ready'].includes(delivery.status),
                    })
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Available Deliveries</h5>
              <Badge bg="warning">{availableDeliveries.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {availableDeliveries.length === 0 ? (
                <div className="p-4 text-center text-muted">No new delivery requests right now.</div>
              ) : (
                <ListGroup variant="flush">
                  {availableDeliveries.map((delivery) =>
                    renderDeliveryItem(delivery, { showAccept: true })
                  )}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Deliveries</h5>
              <Badge bg="success">{recentDeliveries.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {recentDeliveries.length === 0 ? (
                <div className="p-4 text-center text-muted">Complete deliveries will appear here.</div>
              ) : (
                <ListGroup variant="flush">
                  {recentDeliveries.map((delivery) => renderDeliveryItem(delivery))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DriverDashboard;
