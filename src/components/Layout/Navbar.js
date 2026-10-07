import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Badge, Dropdown } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaBell } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'driver':
        return '/driver/dashboard';
      case 'restaurant_owner':
        return '/owner/dashboard';
      case 'staff':
        return '/pos';
      case 'customer':
        return '/orders';
      default:
        return '/';
    }
  };

  return (
    <BSNavbar expand="lg" className="app-navbar" expanded={expanded}>
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="gradient-text display-6 mb-0">
          <span role="img" aria-label="tasty trails" className="me-2">🌮</span>
          TastyTrails
        </BSNavbar.Brand>
        <BSNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)}
        />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/restaurants" onClick={() => setExpanded(false)}>
              Restaurants
            </Nav.Link>
            {user && (
              <Nav.Link as={Link} to="/orders" onClick={() => setExpanded(false)}>
                My Orders
              </Nav.Link>
            )}
            {user?.role === 'customer' && (
              <>
                <Nav.Link as={Link} to="/ai-meal-recommendation" onClick={() => setExpanded(false)}>
                  AI Meal Plan
                </Nav.Link>
                <Nav.Link as={Link} to="/ai-order" onClick={() => setExpanded(false)}>
                  Chatbot Order
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav className="ms-auto align-items-center gap-2">
            {user && user.role === 'customer' && (
              <Nav.Link as={Link} to="/cart" className="position-relative" onClick={() => setExpanded(false)}>
                <FaShoppingCart size={20} />
                {getCartCount() > 0 && (
                  <Badge 
                    bg="primary" 
                    pill 
                    className="position-absolute top-0 start-100 translate-middle"
                  >
                    {getCartCount()}
                  </Badge>
                )}
              </Nav.Link>
            )}
            
            {user ? (
              <>
                <Dropdown align="end" className="ms-2">
                  <Dropdown.Toggle variant="light" id="user-dropdown">
                    <FaUser className="me-2" />
                    {user.name}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to={getDashboardLink()} onClick={() => setExpanded(false)}>
                      Dashboard
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={() => setExpanded(false)} className="fw-semibold">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={() => setExpanded(false)}>
                  <button className="btn btn-gradient btn-sm px-3">Sign Up</button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
