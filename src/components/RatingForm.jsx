import React, { useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';

const ratingFields = [
  { key: 'rating_taste', label: 'Taste' },
  { key: 'rating_quantity', label: 'Portion Quantity' },
  { key: 'rating_hygiene', label: 'Hygiene' },
  { key: 'rating_value', label: 'Value for Money' },
];

const RatingForm = ({ onSubmit, submitting }) => {
  const [ratings, setRatings] = useState({
    rating_taste: 4,
    rating_quantity: 4,
    rating_hygiene: 4,
    rating_value: 4,
  });

  const handleChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(ratings);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Card.Title className="fw-bold">Rate this Restaurant</Card.Title>
        <Card.Text className="text-muted">
          Move the sliders to rate each category from 1 (poor) to 5 (excellent).
        </Card.Text>
        <Form onSubmit={handleSubmit}>
          <Row className="gy-4">
            {ratingFields.map(({ key, label }) => (
              <Col md={6} key={key}>
                <Form.Group>
                  <Form.Label className="fw-semibold d-flex justify-content-between">
                    <span>{label}</span>
                    <span>{ratings[key]}</span>
                  </Form.Label>
                  <Form.Range
                    min={1}
                    max={5}
                    value={ratings[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                  <div className="d-flex justify-content-between text-muted small">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </Form.Group>
              </Col>
            ))}
          </Row>
          <div className="d-flex justify-content-end mt-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Rating'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RatingForm;
