import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaClock, FaMotorcycle } from 'react-icons/fa';
import { restaurantAPI } from '../services/api';
import { toast } from 'react-toastify';

const Home = () => {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeaturedRestaurants();
  }, []);

  const fetchFeaturedRestaurants = async () => {
    try {
      const response = await restaurantAPI.getFeatured();
      setFeaturedRestaurants(response.data.data);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/restaurants?search=${searchQuery}`;
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section text-white py-5 py-lg-6">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <Badge bg="light" text="dark" className="floating-badge mb-3">
                <span>🚀</span>
                30-Min Delivery Guarantee
              </Badge>
              <h1 className="display-4 fw-bold mb-3 gradient-text">
                Delicious Food, Delivered With Style
              </h1>
              <p className="lead text-light mb-4">
                Discover curated restaurants, lightning-fast delivery, and exclusive deals tailored for your taste.
              </p>
              <Form onSubmit={handleSearch} className="d-flex flex-column flex-md-row gap-3">
                <Form.Control
                  type="text"
                  placeholder="Search for restaurants or cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  className="shadow-sm"
                />
                <Button type="submit" className="btn-gradient btn-lg px-4">
                  Start Exploring
                </Button>
              </Form>
              <div className="chips-container">
                {['Sushi', 'Burgers', 'Healthy', 'Desserts'].map((chip) => (
                  <span key={chip} className="chip">#{chip}</span>
                ))}
              </div>
            </Col>
            <Col lg={6} className="hero-illustration d-none d-lg-flex">
              <div className="hero-bubble">
                🍱
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="section-heading">Why Customers Love Us</h2>
          <p className="section-subtitle mx-auto">
            We crafted an experience that blends gourmet flavors with tech-powered convenience.
          </p>
        </div>
        <Row className="g-4">
          {[{
            icon: '🍔',
            title: 'Wide Selection',
            copy: 'Choose from 200+ restaurants, curated by local food experts.'
          }, {
            icon: '⚡',
            title: 'Real-time Tracking',
            copy: 'Follow your delivery minute-by-minute from kitchen to doorstep.'
          }, {
            icon: '💳',
            title: 'Flexible Payments',
            copy: 'Pay with cards, wallets, or cash—the choice is yours.'
          }].map(({ icon, title, copy }) => (
            <Col md={4} key={title}>
              <Card className="feature-card text-center h-100 p-4">
                <div className="feature-icon mx-auto">{icon}</div>
                <h4 className="fw-semibold mb-3">{title}</h4>
                <p className="text-muted-soft mb-0">{copy}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Featured Restaurants */}
      <Container className="py-5">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="section-heading mb-1">Featured Restaurants</h2>
            <p className="text-muted-soft mb-0">Handpicked spots with rave reviews and trending flavors.</p>
          </div>
          <Link to="/restaurants" className="btn btn-soft">
            Explore Full Directory
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <Row className="g-4">
            {featuredRestaurants.map((restaurant) => (
              <Col key={restaurant.id} md={6} lg={4}>
                <Card className="menu-card h-100">
                  <div className="menu-card__image">🍽️</div>
                  <Card.Body className="menu-card__body">
                    <Card.Title className="fw-bold mb-2">{restaurant.name}</Card.Title>
                    <Card.Text className="text-muted-soft text-truncate-2 mb-3">
                      {restaurant.description}
                    </Card.Text>
                    <div className="menu-card__meta">
                      <div className="d-flex align-items-center">
                        <FaStar className="rating-stars me-1" />
                        <span className="fw-semibold">{restaurant.rating}</span>
                        <span className="text-muted-soft ms-1">({restaurant.total_reviews})</span>
                      </div>
                      <div className="d-flex align-items-center text-muted-soft">
                        <FaClock className="me-1" />
                        <span>{restaurant.delivery_time} min</span>
                      </div>
                    </div>
                    <div className="menu-card__cta">
                      <div className="d-flex align-items-center text-muted-soft">
                        <FaMotorcycle className="me-1" />
                        <span>${restaurant.delivery_fee}</span>
                      </div>
                      <Link 
                        to={`/restaurants/${restaurant.id}`}
                        className="btn btn-gradient btn-sm px-3"
                      >
                        View Menu
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      {/* CTA Section */}
      <Container className="py-5">
        <div className="cta-section shadow-sm">
          <h2 className="section-heading mb-3">Ready to taste something new?</h2>
          <p className="section-subtitle mx-auto mb-4">
            Join thousands of foodies discovering new favorites and unlocking exclusive rewards daily.
          </p>
          <Link to="/restaurants" className="btn btn-gradient btn-lg px-4">
            Browse Restaurants
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default Home;
