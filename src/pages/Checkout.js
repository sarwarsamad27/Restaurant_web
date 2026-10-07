import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../services/api';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { cart, restaurant, getGrandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    order_type: 'delivery',
    payment_method: 'cash',
    delivery_address: user?.address || '',
    customer_phone: user?.phone || '',
    special_instructions: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        restaurant_id: restaurant.id,
        order_type: formData.order_type,
        payment_method: formData.payment_method,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        delivery_address: formData.delivery_address,
        delivery_latitude: 40.7128,
        delivery_longitude: -74.0060,
        customer_phone: formData.customer_phone,
        special_instructions: formData.special_instructions,
      };

      console.log('Sending order data:', orderData);
      const response = await orderAPI.create(orderData);
      console.log('Order response:', response.data);
      const order = response.data.data?.order || response.data.data;

      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/orders/${order.id}/track`);
    } catch (error) {
      console.error('Order error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="fw-bold mb-4">Checkout</h1>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Delivery Information</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Order Type</Form.Label>
                  <Form.Select name="order_type" value={formData.order_type} onChange={handleChange}>
                    <option value="delivery">Delivery</option>
                    <option value="takeaway">Takeaway</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Special Instructions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    placeholder="Any special requests?"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Payment Method</h5>
                <Form.Group>
                  <Form.Check
                    type="radio"
                    label="Cash on Delivery"
                    name="payment_method"
                    value="cash"
                    checked={formData.payment_method === 'cash'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    label="Stripe (Card Payment)"
                    name="payment_method"
                    value="stripe"
                    checked={formData.payment_method === 'stripe'}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="radio"
                    label="PayPal"
                    name="payment_method"
                    value="paypal"
                    checked={formData.payment_method === 'paypal'}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <p><strong>{restaurant?.name}</strong></p>
                <p className="text-muted">{cart.length} items</p>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total</strong>
                  <strong className="text-primary">${getGrandTotal().toFixed(2)}</strong>
                </div>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Checkout;
