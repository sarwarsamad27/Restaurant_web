import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Spinner,
  Alert,
  Badge,
  Button,
  ButtonGroup,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI, ratingAPI } from '../../services/api';

const DEFAULT_META = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
};

const AdminRestaurantRatings = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');

  const [ratings, setRatings] = useState([]);
  const [ratingsMeta, setRatingsMeta] = useState(DEFAULT_META);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const perPage = 10;

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) {
      return;
    }

    fetchSummary(selectedRestaurantId);
    fetchRatings(selectedRestaurantId, 1);
  }, [selectedRestaurantId]);

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);

    try {
      const response = await adminAPI.getRestaurants({ per_page: 100 });
      const payload = response.data?.data;
      const list = payload?.data || [];
      setRestaurants(list);

      if (list.length) {
        setSelectedRestaurantId(String(list[0].id));
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load restaurants.';
      toast.error(message);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchSummary = async (restaurantId) => {
    setSummaryLoading(true);
    try {
      const response = await ratingAPI.summary(restaurantId);
      setSummary(response.data?.data || null);
    } catch (error) {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchRatings = async (restaurantId, page = 1) => {
    setRatingsLoading(true);

    try {
      const response = await adminAPI.getRestaurantRatings(restaurantId, {
        page,
        per_page: perPage,
      });

      setRatings(response.data?.data || []);
      setRatingsMeta({
        current_page: response.data?.meta?.current_page || 1,
        last_page: response.data?.meta?.last_page || 1,
        per_page: response.data?.meta?.per_page || perPage,
        total: response.data?.meta?.total || 0,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load ratings.';
      toast.error(message);
      setRatings([]);
      setRatingsMeta(DEFAULT_META);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleRestaurantChange = (event) => {
    setSelectedRestaurantId(event.target.value);
  };

  const handlePageChange = (page) => {
    if (!selectedRestaurantId) return;
    if (page < 1 || page > ratingsMeta.last_page) return;
    fetchRatings(selectedRestaurantId, page);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <Container className="py-5">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="fw-bold mb-1">Restaurant Ratings</h1>
          <p className="text-muted mb-0">
            Review detailed community feedback for each restaurant, including user information and category scores.
          </p>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6} sm={8} xs={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">Select Restaurant</Form.Label>
                <Form.Select
                  value={selectedRestaurantId}
                  onChange={handleRestaurantChange}
                  disabled={restaurantsLoading}
                >
                  {restaurantsLoading && <option>Loading…</option>}
                  {!restaurantsLoading && !restaurants.length && <option value="">No restaurants available</option>}
                  {!restaurantsLoading && restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} sm={4} xs={12}>
              <div className="text-muted small">
                Showing {ratingsMeta.total} rating{ratingsMeta.total === 1 ? '' : 's'}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {summaryLoading ? (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="py-5 text-center">
            <Spinner animation="border" role="status" />
          </Card.Body>
        </Card>
      ) : summary ? (
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">Trust Score</h5>
                    <div className="text-muted small">Average community rating</div>
                  </div>
                  <Badge bg="primary" className="px-3 py-2 text-uppercase">{summary.trust_badge}</Badge>
                </div>
                <div className="display-5 fw-bold text-primary">{summary.trust_score}</div>
                <div className="text-muted small">Based on {summary.total_ratings} ratings</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <h5 className="fw-bold mb-3">Category Breakdown</h5>
                <Row className="gy-3">
                  {Object.entries(summary.averages).map(([key, value]) => (
                    <Col sm={6} key={key}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-capitalize fw-semibold">{key.replace('_', ' ')}</span>
                        <Badge bg="light" text="dark">{Number(value).toFixed(2)} / 5</Badge>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Ratings</h5>
          <Badge bg="secondary" pill>
            Page {ratingsMeta.current_page} of {ratingsMeta.last_page}
          </Badge>
        </Card.Header>
        <Card.Body className="p-0">
          {ratingsLoading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : !selectedRestaurantId ? (
            <div className="py-5 text-center text-muted">Select a restaurant to view ratings.</div>
          ) : ratings.length === 0 ? (
            <Alert variant="light" className="m-3 mb-0">
              No ratings found for this restaurant yet.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th className="text-center">Taste</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Hygiene</th>
                    <th className="text-center">Value</th>
                    <th className="text-center">Average</th>
                    <th className="text-center">Badge</th>
                    <th className="text-end">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((rating) => (
                    <tr key={rating.id}>
                      <td className="fw-semibold">{rating.user?.name || 'Anonymous'}</td>
                      <td>{rating.user?.email || '—'}</td>
                      <td className="text-center">{rating.ratings?.taste ?? '—'}</td>
                      <td className="text-center">{rating.ratings?.quantity ?? '—'}</td>
                      <td className="text-center">{rating.ratings?.hygiene ?? '—'}</td>
                      <td className="text-center">{rating.ratings?.value ?? '—'}</td>
                      <td className="text-center fw-bold">{Number(rating.average_score).toFixed(2)}</td>
                      <td className="text-center">
                        <Badge bg="primary" className="text-uppercase">{rating.trust_badge}</Badge>
                      </td>
                      <td className="text-end text-muted small">{formatDate(rating.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between align-items-center bg-white">
          <span className="text-muted small">
            Showing page {ratingsMeta.current_page} of {ratingsMeta.last_page}
          </span>
          <ButtonGroup>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={ratingsMeta.current_page <= 1 || ratingsLoading}
              onClick={() => handlePageChange(ratingsMeta.current_page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={ratingsMeta.current_page >= ratingsMeta.last_page || ratingsLoading}
              onClick={() => handlePageChange(ratingsMeta.current_page + 1)}
            >
              Next
            </Button>
          </ButtonGroup>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default AdminRestaurantRatings;
