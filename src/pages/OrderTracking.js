import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ListGroup, Spinner, Image } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { FaCheck, FaClock, FaMotorcycle } from 'react-icons/fa';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';

const OrderTracking = () => {
  const { id } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchTrackingData = async () => {
    try {
      const response = await orderAPI.track(id);
      setTrackingData(response.data.data);
    } catch (error) {
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const { order, timeline } = trackingData;

  return (
    <Container className="py-5">
      <h1 className="fw-bold mb-4">Track Order #{order.order_number}</h1>
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">Order Status</h5>
              <div className="d-flex align-items-center mb-4">
                <Badge bg={getStatusColor(order.status)} className="fs-6">
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <ListGroup variant="flush">
                {Object.entries(timeline).map(([status, timestamp]) => (
                  timestamp && (
                    <ListGroup.Item key={status} className="d-flex align-items-center">
                      <FaCheck className="text-success me-3" />
                      <div>
                        <strong>{status.replace('_', ' ').toUpperCase()}</strong>
                        <p className="text-muted mb-0 small">
                          {new Date(timestamp).toLocaleString()}
                        </p>
                      </div>
                    </ListGroup.Item>
                  )
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Order Items</h5>
              <ListGroup variant="flush">
                {order.items.map((item) => (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                      {item.menu_item?.image ? (
                        <Image
                          src={item.menu_item.image}
                          alt={item.menu_item?.name || item.item_name}
                          rounded
                          style={{ width: '64px', height: '48px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '64px', height: '48px' }}>
                          <span className="text-muted small">No image</span>
                        </div>
                      )}
                      <div>
                        <div className="fw-bold">{item.menu_item?.name || item.item_name}</div>
                        <div className="text-muted">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="fw-bold">${Number(item.subtotal).toFixed(2)}</div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Delivery Details</h5>
              <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
              <p><strong>Address:</strong> {order.delivery_address}</p>
              <p><strong>Phone:</strong> {order.customer_phone}</p>
              {order.driver && (
                <>
                  <hr />
                  <h6>Driver Information</h6>
                  <p><strong>Name:</strong> {order.driver.name}</p>
                  <p><strong>Phone:</strong> {order.driver.phone}</p>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderTracking;
