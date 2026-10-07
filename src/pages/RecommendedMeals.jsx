import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { aiAPI } from '../services/api';

const healthGoals = ['Weight Loss', 'Muscle Gain', 'Maintenance'];
const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Lactose-Free', 'Dairy-Free'];

const RecommendedMeals = () => {
  const [goal, setGoal] = useState('Maintenance');
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [meals, setMeals] = useState([]);

  const handleRestrictionToggle = (option) => {
    setRestrictions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await aiAPI.recommendMeals({
        goal,
        daily_calories: Number(dailyCalories),
        dietary_restrictions: restrictions,
      });

      setSummary(data.summary);
      setMeals(data.meals || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recommendations.');
      setMeals([]);
      setSummary('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col md={8} className="mx-auto">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="fw-bold mb-3">AI Smart Meal Recommendations</h2>
              <p className="text-muted mb-4">
                Tell us about your health goal and dietary needs. We&apos;ll suggest meals tailored to you.
              </p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Health Goal</Form.Label>
                  <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                    {healthGoals.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Daily Calorie Target</Form.Label>
                      <Form.Control
                        type="number"
                        min={800}
                        max={6000}
                        value={dailyCalories}
                        onChange={(e) => setDailyCalories(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-3">
                  <Form.Label>Dietary Restrictions</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    {dietaryOptions.map((option) => {
                      const active = restrictions.includes(option);
                      return (
                        <Badge
                          key={option}
                          bg={active ? 'primary' : 'light'}
                          text={active ? 'white' : 'dark'}
                          pill
                          className="px-3 py-2"
                          role="button"
                          onClick={() => handleRestrictionToggle(option)}
                        >
                          {option}
                        </Badge>
                      );
                    })}
                  </div>
                </Form.Group>

                <div className="d-flex justify-content-end mt-4">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Finding meals...
                      </>
                    ) : (
                      'Get Recommendations'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col md={8} className="mx-auto">
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {summary && (
        <Row className="mb-4">
          <Col md={8} className="mx-auto">
            <Alert variant="info" className="mb-0">
              <strong>Why these meals?</strong>
              <div className="mt-2 mb-0">{summary}</div>
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="g-4">
        {meals.map((meal) => (
          <Col key={meal.id} md={6} lg={4}>
            <Card className="border-0 shadow-sm h-100">
              {meal.image_url ? (
                <Card.Img
                  variant="top"
                  src={meal.image_url}
                  alt={meal.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                  loading="lazy"
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ height: '200px', background: '#f8f9fa' }}
                >
                  <span className="text-muted">No image</span>
                </div>
              )}
              <Card.Body className="d-flex flex-column">
                <div className="mb-2">
                  <h5 className="fw-bold mb-1">{meal.name}</h5>
                  <p className="text-muted small mb-0">{meal.description || 'No description provided.'}</p>
                </div>
                <div className="mb-3">
                  <div className="text-muted small">Restaurant</div>
                  <div className="fw-semibold">{meal.restaurant?.name || 'Any available restaurant'}</div>
                </div>
                <div className="mb-3">
                  <h6 className="fw-semibold mb-2">Nutrition</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <Badge bg="secondary" className="px-2">{meal.macros.calories || '—'} kcal</Badge>
                    <Badge bg="success" className="px-2">{meal.macros.protein || '—'}g protein</Badge>
                    <Badge bg="info" className="px-2">{meal.macros.carbs || '—'}g carbs</Badge>
                    <Badge bg="warning" text="dark" className="px-2">{meal.macros.fats || '—'}g fats</Badge>
                  </div>
                </div>
                <div className="mt-auto d-flex justify-content-between align-items-center">
                  <div className="fw-bold">${Number(meal.price).toFixed(2)}</div>
                  <Badge bg="primary" pill>
                    Score {meal.score}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {!loading && meals.length === 0 && !error && summary === '' && (
        <Row className="mt-5">
          <Col md={8} className="mx-auto text-center text-muted">
            <p>Request recommendations to see personalized meal suggestions here.</p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default RecommendedMeals;
