import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, Image } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { FaStar, FaClock, FaMotorcycle, FaLeaf, FaFire } from 'react-icons/fa';
import { restaurantAPI, ratingAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import RatingForm from '../components/RatingForm';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [submittingRating, setSubmittingRating] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchRestaurantDetails();
    fetchRatingSummary();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantAPI.getById(id),
        restaurantAPI.getMenu(id),
      ]);
      setRestaurant(restaurantRes.data.data);
      setMenuItems(menuRes.data.data.menu);
    } catch (error) {
      toast.error('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (user?.role !== 'customer') {
      toast.info('Only customers can add items to the cart.');
      return;
    }

    addToCart({ ...item, restaurant_id: restaurant.id, restaurant });
  };

  const fetchRatingSummary = async () => {
    try {
      setRatingLoading(true);
      const response = await ratingAPI.summary(id);
      setRatingSummary(response.data.data);
    } catch (error) {
      // Fail silently but keep UI functional
      setRatingSummary(null);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleRatingSubmit = async (values) => {
    if (!user) {
      toast.info('Please login to submit a rating.');
      return;
    }

    setSubmittingRating(true);
    try {
      await ratingAPI.submit({
        restaurant_id: Number(id),
        ...values,
      });
      toast.success('Thank you for your feedback!');
      fetchRatingSummary();
    } catch (error) {
      const message = error.response?.data?.message || 'Could not submit rating.';
      toast.error(message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const canAddToCart = user?.role === 'customer';
  const canRateRestaurant = user?.role === 'customer';

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <Container className="py-5 text-center">
        <h3>Restaurant not found</h3>
      </Container>
    );
  }

  return (
    <div>
      {/* Restaurant Header */}
      <div className="bg-primary text-white py-4">
        <Container>
          <Row>
            <Col>
              <h1 className="fw-bold">{restaurant.name}</h1>
              <p className="mb-2">{restaurant.description}</p>
              <div className="d-flex gap-4 flex-wrap align-items-center">
                <span><FaStar className="text-warning" /> {restaurant.rating} ({restaurant.total_reviews} reviews)</span>
                <span><FaClock /> {restaurant.delivery_time} min</span>
                <span><FaMotorcycle /> ${restaurant.delivery_fee} delivery</span>
                {ratingSummary && (
                  <Badge bg="light" text="dark" className="border border-primary text-uppercase">
                    Trust: {ratingSummary.trust_badge} ({ratingSummary.trust_score})
                  </Badge>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Menu */}
      <Container className="py-5">
        {!ratingLoading && ratingSummary && (
          <Row className="mb-5 g-4">
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">Trust Score</h5>
                      <div className="text-muted small">Community-powered confidence</div>
                    </div>
                    <Badge bg="primary" className="px-3 py-2">
                      {ratingSummary.trust_badge}
                    </Badge>
                  </div>
                  <div className="display-4 fw-bold text-primary">{ratingSummary.trust_score}</div>
                  <div className="text-muted small">Based on {ratingSummary.total_ratings} ratings</div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={8}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Community Insights</h5>
                  <Row className="gy-3">
                    {Object.entries(ratingSummary.averages).map(([key, value]) => (
                      <Col md={6} key={key}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-capitalize fw-semibold">{key.replace('_', ' ')}</div>
                          <div className="badge bg-light text-dark">{Number(value).toFixed(1)} / 5</div>
                        </div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${(Number(value) / 5) * 100}%` }}
                            aria-valuemin="0"
                            aria-valuemax="5"
                            aria-valuenow={Number(value).toFixed(1)}
                          />
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {canRateRestaurant && (
          <Row className="mb-5">
            <Col lg={6}>
              <RatingForm onSubmit={handleRatingSubmit} submitting={submittingRating} />
            </Col>
          </Row>
        )}

        <h2 className="fw-bold mb-4">Menu</h2>
        <Tabs defaultActiveKey={Object.keys(menuItems)[0]} className="mb-4">
          {Object.entries(menuItems).map(([category, items]) => (
            <Tab key={category} eventKey={category} title={category}>
              <Row className="g-4 mt-2">
                {items.map((item) => (
                  <Col key={item.id} md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <div
                        className="bg-white d-flex align-items-center justify-content-center rounded-top position-relative"
                        style={{
                          height: '210px',
                          overflow: 'hidden',
                          borderBottom: '1px solid #edf2f7',
                          background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
                        }}
                      >
                        {(item.image_url || item.image) ? (
                          <Image
                            src={item.image_url || item.image}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'contrast(1.03) saturate(1.03)' }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-muted small">No image</div>
                        )}
                      </div>
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold">{item.name}</h5>
                            <p className="text-muted small">{item.description}</p>
                            <div className="mb-2">
                              {item.is_vegetarian && (
                                <Badge bg="success" className="me-1">
                                  <FaLeaf /> Veg
                                </Badge>
                              )}
                              {item.is_spicy && (
                                <Badge bg="danger" className="me-1">
                                  <FaFire /> Spicy
                                </Badge>
                              )}
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                {item.discount_price ? (
                                  <>
                                    <span className="fw-bold text-success">${item.discount_price}</span>
                                    <span className="text-muted text-decoration-line-through ms-2">
                                      ${item.price}
                                    </span>
                                  </>
                                ) : (
                                  <span className="fw-bold">${item.price}</span>
                                )}
                              </div>
                              {canAddToCart && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleAddToCart(item)}
                                  disabled={!item.is_available}
                                >
                                  {item.is_available ? 'Add to Cart' : 'Unavailable'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>
          ))}
        </Tabs>
      </Container>
    </div>
  );
};

export default RestaurantDetail;
