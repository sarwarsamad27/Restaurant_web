import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Image,
  Badge,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { authAPI, restaurantAPI, menuItemAPI } from '../../services/api';

const OwnerMenu = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantUploading, setRestaurantUploading] = useState(false);
  const [restaurantImageFiles, setRestaurantImageFiles] = useState({
    image: null,
    cover_image: null,
  });
  const [menuFiles, setMenuFiles] = useState({});
  const [menuUploading, setMenuUploading] = useState({});
  const [formKey, setFormKey] = useState(0);
  const [menuFormKey, setMenuFormKey] = useState(0);
  const storageBase = (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000/storage').replace(/\/$/, '');

  useEffect(() => {
    loadOwnerRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/^storage\/?/i, '').replace(/^\//, '');
    return `${storageBase}/${normalized}`;
  };

  const loadOwnerRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.getMe();
      const ownerData = response.data?.data;
      const owned = ownerData?.restaurants || [];
      setRestaurants(owned);

      if (owned.length) {
        const firstId = owned[0].id;
        setSelectedRestaurantId(String(firstId));
        await loadRestaurantDetails(firstId);
      } else {
        setSelectedRestaurant(null);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load restaurants';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantDetails = async (restaurantId) => {
    if (!restaurantId) {
      setSelectedRestaurant(null);
      return;
    }

    setRestaurantLoading(true);
    setError('');
    try {
      const detail = await restaurantAPI.getById(restaurantId);
      setSelectedRestaurant(detail.data?.data || null);
      setRestaurantImageFiles({ image: null, cover_image: null });
      setMenuFiles({});
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load restaurant details';
      setError(message);
      toast.error(message);
    } finally {
      setRestaurantLoading(false);
    }
  };

  const handleRestaurantChange = async (event) => {
    const value = event.target.value;
    setSelectedRestaurantId(value);
    if (value) {
      await loadRestaurantDetails(value);
    }
  };

  const handleRestaurantImageSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRestaurantId) return;
    if (!restaurantImageFiles.image && !restaurantImageFiles.cover_image) {
      toast.info('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    if (restaurantImageFiles.image) {
      formData.append('image', restaurantImageFiles.image);
    }
    if (restaurantImageFiles.cover_image) {
      formData.append('cover_image', restaurantImageFiles.cover_image);
    }

    setRestaurantUploading(true);
    try {
      await restaurantAPI.update(selectedRestaurantId, formData);
      toast.success('Restaurant images updated successfully.');
      setFormKey((key) => key + 1);
      await loadRestaurantDetails(selectedRestaurantId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update restaurant images';
      toast.error(message);
    } finally {
      setRestaurantUploading(false);
    }
  };

  const handleMenuFileChange = (menuId, file) => {
    setMenuFiles((prev) => ({
      ...prev,
      [menuId]: file || null,
    }));
  };

  const handleMenuImageSubmit = async (event, menuId) => {
    event.preventDefault();
    const file = menuFiles[menuId];

    if (!file) {
      toast.info('Please select an image to upload for this menu item.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setMenuUploading((prev) => ({ ...prev, [menuId]: true }));
    try {
      await menuItemAPI.update(menuId, formData);
      toast.success('Menu item image updated.');
      setMenuFormKey((key) => key + 1);
      await loadRestaurantDetails(selectedRestaurantId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update menu item image';
      toast.error(message);
    } finally {
      setMenuUploading((prev) => ({ ...prev, [menuId]: false }));
      setMenuFiles((prev) => {
        const updated = { ...prev };
        delete updated[menuId];
        return updated;
      });
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error && !restaurants.length) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={loadOwnerRestaurants} className="mt-3">
          Retry
        </Button>
      </Container>
    );
  }

  if (!restaurants.length) {
    return (
      <Container className="py-5">
        <Alert variant="info">
          You do not have any restaurants yet. Please contact the administrator to set up your restaurant.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h1 className="fw-bold mb-2">Manage Restaurant Media</h1>
          <p className="text-muted mb-0">Upload and update images for your restaurants and their menu items.</p>
        </div>
        <div className="mt-3 mt-md-0">
          <Button variant="outline-primary" onClick={loadOwnerRestaurants} disabled={loading || restaurantLoading}>
            Refresh Data
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={6} lg={4} className="mb-3">
          <Form.Group controlId="ownerRestaurantSelector">
            <Form.Label>Select Restaurant</Form.Label>
            <Form.Select value={selectedRestaurantId} onChange={handleRestaurantChange}>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {restaurantLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading restaurant details...</span>
          </Spinner>
        </div>
      )}

      {!restaurantLoading && selectedRestaurant && (
        <>
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="fw-bold">Restaurant Images</Card.Title>
                  <p className="text-muted">Upload a logo/thumbnail and cover image for the selected restaurant.</p>

                  <Row className="g-3">
                    <Col md={6}>
                      <div className="border rounded p-2 h-100 d-flex flex-column align-items-center justify-content-center bg-light">
                        <span className="fw-semibold mb-2">Current Image</span>
                        {getImageUrl(selectedRestaurant.image) ? (
                          <Image
                            src={getImageUrl(selectedRestaurant.image)}
                            rounded
                            fluid
                            alt="Restaurant"
                            style={{ maxHeight: '150px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="text-muted text-center">No image uploaded</div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="border rounded p-2 h-100 d-flex flex-column align-items-center justify-content-center bg-light">
                        <span className="fw-semibold mb-2">Current Cover Image</span>
                        {getImageUrl(selectedRestaurant.cover_image) ? (
                          <Image
                            src={getImageUrl(selectedRestaurant.cover_image)}
                            rounded
                            fluid
                            alt="Cover"
                            style={{ maxHeight: '150px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="text-muted text-center">No cover image uploaded</div>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <Form key={formKey} className="mt-3" onSubmit={handleRestaurantImageSubmit}>
                    <Row className="g-3 align-items-end">
                      <Col md={6}>
                        <Form.Group controlId="restaurantImage">
                          <Form.Label>Restaurant Image</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              setRestaurantImageFiles((prev) => ({
                                ...prev,
                                image: event.target.files?.[0] || null,
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="restaurantCoverImage">
                          <Form.Label>Cover Image</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              setRestaurantImageFiles((prev) => ({
                                ...prev,
                                cover_image: event.target.files?.[0] || null,
                              }))
                            }
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                      <Button type="submit" variant="primary" disabled={restaurantUploading}>
                        {restaurantUploading ? 'Uploading…' : 'Save Images'}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="fw-bold">Restaurant Details</Card.Title>
                  <p className="mb-1"><strong>Name:</strong> {selectedRestaurant.name}</p>
                  <p className="mb-1"><strong>Address:</strong> {selectedRestaurant.address}</p>
                  <p className="mb-1"><strong>Phone:</strong> {selectedRestaurant.phone || '—'}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedRestaurant.email || '—'}</p>
                  <p className="mb-1"><strong>Delivery Fee:</strong> ${Number(selectedRestaurant.delivery_fee || 0).toFixed(2)}</p>
                  <p className="mb-1"><strong>Delivery Time:</strong> {selectedRestaurant.delivery_time ? `${selectedRestaurant.delivery_time} mins` : '—'}</p>
                  <p className="mb-0"><strong>Menu Items:</strong> {selectedRestaurant.menu_items?.length || 0}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="fw-bold mb-0">Menu Item Images</Card.Title>
                <span className="text-muted">Update the image for each menu item individually.</span>
              </div>

              {!(selectedRestaurant.menu_items?.length > 0) ? (
                <Alert variant="info" className="mb-0">
                  No menu items found. Add items first to upload images.
                </Alert>
              ) : (
                <Row className="g-4">
                  {selectedRestaurant.menu_items.map((menuItem) => (
                    <Col md={6} lg={4} key={`${menuItem.id}-${menuFormKey}`}>
                      <Card className="h-100 border-0 shadow-sm">
                        {getImageUrl(menuItem.image) ? (
                          <Image
                            src={getImageUrl(menuItem.image)}
                            alt={menuItem.name}
                            fluid
                            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '180px' }}>
                            <span className="text-muted">No image uploaded</span>
                          </div>
                        )}
                        <Card.Body className="d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <Card.Title className="h5 mb-1">{menuItem.name}</Card.Title>
                              <div className="text-muted small">${Number(menuItem.price).toFixed(2)}</div>
                            </div>
                            <Badge bg={menuItem.is_available ? 'success' : 'secondary'}>
                              {menuItem.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>

                          <Form onSubmit={(event) => handleMenuImageSubmit(event, menuItem.id)}>
                            <Form.Group controlId={`menuItemImage-${menuItem.id}`} className="mb-3">
                              <Form.Label className="small">Upload New Image</Form.Label>
                              <Form.Control
                                key={`${menuItem.id}-${menuFormKey}`}
                                type="file"
                                accept="image/*"
                                onChange={(event) => handleMenuFileChange(menuItem.id, event.target.files?.[0] || null)}
                              />
                            </Form.Group>
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              disabled={!!menuUploading[menuItem.id]}
                            >
                              {menuUploading[menuItem.id] ? 'Uploading…' : 'Save' }
                            </Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default OwnerMenu;
