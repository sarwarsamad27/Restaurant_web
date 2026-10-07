import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { toast } from 'react-toastify';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders(false);
    }, 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await orderAPI.getAll();
      setOrders(response.data.data.data || response.data.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner-container"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <Container className="py-5">
      <h1 className="fw-bold mb-4">My Orders</h1>
      {orders.length === 0 ? (
        <Card className="text-center p-5"><p>No orders yet</p></Card>
      ) : (
        <ListGroup>
          {orders.map((order) => (
            <ListGroup.Item key={order.id} className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5>Order #{order.order_number}</h5>
                  <p className="text-muted mb-1">{order.restaurant.name}</p>
                  <Badge bg="primary">{order.status}</Badge>
                </div>
                <div className="text-end">
                  <h5 className="text-primary">${order.total}</h5>
                  <Link to={`/orders/${order.id}/track`} className="btn btn-sm btn-outline-primary">
                    Track Order
                  </Link>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default MyOrders;
