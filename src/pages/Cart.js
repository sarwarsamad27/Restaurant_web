// Cart.js - The shopping cart page where users can review their order before checkout
// Note: We're using Bootstrap for styling because it's quick and gets the job done

import React, { useCallback } from 'react';
import { 
  Container, Row, Col, Card, Button, ListGroup, Badge, 
  Alert, Spinner 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaTrash, FaPlus, FaMinus, FaShoppingCart, 
  FaExclamationTriangle, FaArrowLeft 
} from 'react-icons/fa';

// Using context for cart state management - keeps things simple for now
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// We'll add this later for better error handling
// import { trackCartView } from '../utils/analytics';

const Cart = () => {
  // Get cart state and actions from our context
  const { 
    cart, 
    restaurant, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    getTax, 
    getDeliveryFee, 
    getGrandTotal,
    isLoading  // We'll add loading state later
  } = useCart();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Track when users view their cart (for analytics)
  // useEffect(() => {
  //   if (cart.length > 0) {
  //     trackCartView(cart);
  //   }
  // }, [cart]);

  const handleCheckout = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Show empty state if cart is empty
  if (cart.length === 0) {
    return (
      <Container className="py-5 text-center">
        <FaShoppingCart size={80} className="text-muted mb-3" />
        <h3>Your cart is empty</h3>
        <p className="text-muted mb-4">Looks like you haven't added anything tasty yet!</p>
        <div className="d-flex gap-2 justify-content-center">
          <Link to="/restaurants" className="btn btn-primary">
            <FaArrowLeft className="me-2" />
            Find Restaurants
          </Link>
          <Link to="/orders" className="btn btn-outline-secondary">
            View Past Orders
          </Link>
        </div>
      </Container>
    );
  }

  // Show loading spinner if cart is being updated
  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Updating your cart...</span>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Your Order</h1>
        <Link to={`/restaurants/${restaurant?.id}`} className="text-decoration-none">
          <Button variant="outline-primary" size="sm">
            <FaPlus className="me-1" /> Add More Items
          </Button>
        </Link>
      </div>
      
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Ordering from: <span className="text-primary">{restaurant?.name}</span>
              </h5>
              <Badge bg="light" text="dark">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </Badge>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.map((item, index) => (
                <ListGroup.Item key={`${item.id}-${index}`}>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6 className="mb-1">{item.name}</h6>
                      <p className="text-muted small mb-0">${item.discount_price || item.price} each</p>
                    </Col>
                    <Col md={3}>
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.customizations)}
                        >
                          <FaMinus />
                        </Button>
                        <span className="fw-bold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.customizations)}
                        >
                          <FaPlus />
                        </Button>
                      </div>
                    </Col>
                    <Col md={2} className="text-end">
                      <strong>${((item.discount_price || item.price) * item.quantity).toFixed(2)}</strong>
                    </Col>
                    <Col md={1} className="text-end">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => removeFromCart(item.id, item.customizations)}
                      >
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax (10%)</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Delivery Fee</span>
                <span>${getDeliveryFee().toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total</strong>
                <strong className="text-primary">${getGrandTotal().toFixed(2)}</strong>
              </div>
              <Button 
                variant="primary" 
                className="w-100"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
