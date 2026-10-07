import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { FaStar, FaClock, FaMotorcycle, FaSearch } from 'react-icons/fa';
import { restaurantAPI } from '../services/api';
import { toast } from 'react-toastify';

const Restaurants = () => {
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    sort_by: 'rating',
    sort_order: 'desc',
  });

  useEffect(() => {
    fetchRestaurants();
  }, [searchQuery, filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        ...filters,
      };
      const response = await restaurantAPI.getAll(params);
      setRestaurants(response.data.data.data || response.data.data);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <Container className="py-5">
      <h1 className="fw-bold mb-4">All Restaurants</h1>

      {/* Search and Filters */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={6}>
                <Form.Label>Search</Form.Label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </Col>
              <Col md={3}>
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  value={filters.sort_by}
                  onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                >
                  <option value="rating">Rating</option>
                  <option value="delivery_time">Delivery Time</option>
                  <option value="created_at">Newest</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button type="submit" variant="primary" className="w-100">
                  Apply Filters
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Restaurant List */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-5">
          <h3 className="text-muted">No restaurants found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <Row className="g-4">
          {restaurants.map((restaurant) => (
            <Col key={restaurant.id} md={6} lg={4}>
              <Card className="h-100 card-hover border-0 shadow-sm">
                {(restaurant.image_url || restaurant.image) ? (
                  <Image
                    src={restaurant.image_url || restaurant.image}
                    alt={restaurant.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                    fluid
                  />
                ) : (
                  <div
                    style={{
                      height: '200px',
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '4rem'
                    }}
                  >
                    🍽️
                  </div>
                )}
                <Card.Body>
                  <Card.Title className="fw-bold">{restaurant.name}</Card.Title>
                  <Card.Text className="text-muted text-truncate-2">
                    {restaurant.description}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <span className="fw-bold">{restaurant.rating}</span>
                      <span className="text-muted ms-1">
                        ({restaurant.total_reviews})
                      </span>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <FaClock className="me-1" />
                      <span>{restaurant.delivery_time} min</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center text-muted">
                      <FaMotorcycle className="me-1" />
                      <span>${restaurant.delivery_fee}</span>
                    </div>
                    <Link 
                      to={`/restaurants/${restaurant.id}`}
                      className="btn btn-primary btn-sm"
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
  );
};

export default Restaurants;
