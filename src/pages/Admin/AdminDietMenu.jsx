import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const goalFilterOptions = [
  { value: 'all', label: 'All diet goals' },
  { value: 'is_weight_loss', label: 'Weight loss friendly' },
  { value: 'is_weight_gain', label: 'Weight gain friendly' },
  { value: 'is_maintenance', label: 'Maintenance friendly' },
];

const macroLimits = {
  calories: 20000,
  protein: 2000,
  carbs: 2000,
  fats: 2000,
};

const macroLabels = {
  calories: 'Calories',
  protein: 'Protein (g)',
  carbs: 'Carbs (g)',
  fats: 'Fats (g)',
};

const toDraftValue = (value) => (value === null || value === undefined ? '' : String(value));

const AdminDietMenu = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [rowStatus, setRowStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDietMenu();
  }, []);

  const buildDrafts = (menuItems) => menuItems.reduce((acc, item) => {
    acc[item.id] = {
      calories: toDraftValue(item.calories),
      protein: toDraftValue(item.protein),
      carbs: toDraftValue(item.carbs),
      fats: toDraftValue(item.fats),
    };
    return acc;
  }, {});

  const buildInitialStatus = (menuItems) => menuItems.reduce((acc, item) => {
    acc[item.id] = 'idle';
    return acc;
  }, {});

  const fetchDietMenu = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError('');

    try {
      const response = await adminAPI.getDietMenu();
      const data = response.data?.data || [];
      setItems(data);
      setDrafts(buildDrafts(data));
      setRowStatus(buildInitialStatus(data));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load diet-based menu items.';
      setError(message);
      toast.error(message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const restaurants = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const restaurantId = item.restaurant_id;
      const restaurantName = item.restaurant?.name || `Restaurant #${restaurantId}`;
      if (restaurantId && !map.has(String(restaurantId))) {
        map.set(String(restaurantId), restaurantName);
      }
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !term
        || item.name.toLowerCase().includes(term)
        || (item.restaurant?.name || '').toLowerCase().includes(term);
      const matchesRestaurant = !restaurantFilter
        || String(item.restaurant_id) === restaurantFilter;
      const matchesGoal = goalFilter === 'all'
        || Boolean(item[goalFilter]);

      return matchesSearch && matchesRestaurant && matchesGoal;
    });
  }, [items, searchTerm, restaurantFilter, goalFilter]);

  const setStatus = (id, status) => {
    setRowStatus((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const resetDraftFromItem = (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    setDrafts((prev) => ({
      ...prev,
      [id]: {
        calories: toDraftValue(item.calories),
        protein: toDraftValue(item.protein),
        carbs: toDraftValue(item.carbs),
        fats: toDraftValue(item.fats),
      },
    }));
  };

  const normalizeNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const parseMacroValue = (field, rawValue) => {
    const limit = macroLimits[field];
    const label = macroLabels[field];

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return null;
    }

    const valueString = String(rawValue).trim();
    if (valueString === '') {
      return null;
    }

    if (!/^\d+$/.test(valueString)) {
      throw new Error(`${label} must be a whole number.`);
    }

    const parsed = Number(valueString);

    if (!Number.isFinite(parsed)) {
      throw new Error(`${label} is invalid.`);
    }

    if (parsed < 0) {
      throw new Error(`${label} cannot be negative.`);
    }

    if (limit && parsed > limit) {
      const limitLabel = limit.toLocaleString();
      throw new Error(`${label} must be ${limitLabel} or less.`);
    }

    return parsed;
  };

  const handleSaveRow = async (id, overrides = {}) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return false;
    }

    const draft = drafts[id] || {
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
    };

    let payload;
    try {
      payload = {
        id,
        calories: parseMacroValue('calories', draft.calories),
        protein: parseMacroValue('protein', draft.protein),
        carbs: parseMacroValue('carbs', draft.carbs),
        fats: parseMacroValue('fats', draft.fats),
        is_weight_loss: Object.prototype.hasOwnProperty.call(overrides, 'is_weight_loss')
          ? overrides.is_weight_loss
          : Boolean(item.is_weight_loss),
        is_weight_gain: Object.prototype.hasOwnProperty.call(overrides, 'is_weight_gain')
          ? overrides.is_weight_gain
          : Boolean(item.is_weight_gain),
        is_maintenance: Object.prototype.hasOwnProperty.call(overrides, 'is_maintenance')
          ? overrides.is_maintenance
          : Boolean(item.is_maintenance),
      };
    } catch (validationError) {
      toast.error(validationError.message);
      setStatus(id, 'error');
      resetDraftFromItem(id);
      return false;
    }

    const hasChanges = (
      payload.calories !== normalizeNumber(item.calories)
      || payload.protein !== normalizeNumber(item.protein)
      || payload.carbs !== normalizeNumber(item.carbs)
      || payload.fats !== normalizeNumber(item.fats)
      || payload.is_weight_loss !== Boolean(item.is_weight_loss)
      || payload.is_weight_gain !== Boolean(item.is_weight_gain)
      || payload.is_maintenance !== Boolean(item.is_maintenance)
    );

    if (!hasChanges) {
      setStatus(id, 'saved');
      return true;
    }

    setStatus(id, 'saving');

    try {
      await adminAPI.updateDietMenu([payload]);
      setItems((prev) => prev.map((entry) => (entry.id === id ? {
        ...entry,
        calories: payload.calories,
        protein: payload.protein,
        carbs: payload.carbs,
        fats: payload.fats,
        is_weight_loss: payload.is_weight_loss,
        is_weight_gain: payload.is_weight_gain,
        is_maintenance: payload.is_maintenance,
      } : entry)));

      setDrafts((prev) => ({
        ...prev,
        [id]: {
          calories: toDraftValue(payload.calories),
          protein: toDraftValue(payload.protein),
          carbs: toDraftValue(payload.carbs),
          fats: toDraftValue(payload.fats),
        },
      }));

      setStatus(id, 'saved');
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update menu item.';
      toast.error(message);
      setStatus(id, 'error');
      resetDraftFromItem(id);
      return false;
    }
  };

  const handleMacroChange = (id, field, value) => {
    const limit = macroLimits[field] || 5;
    const maxDigits = String(limit).length;
    const sanitized = value === '' ? '' : value.replace(/[^\d]/g, '').slice(0, maxDigits);

    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: sanitized,
      },
    }));

    setRowStatus((prev) => ({
      ...prev,
      [id]: prev[id] === 'saving' ? 'saving' : 'dirty',
    }));
  };

  const handleMacroBlur = (id) => {
    handleSaveRow(id);
  };

  const handleMacroKeyDown = (event, id) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSaveRow(id);
    }
  };

  const handleToggle = async (id, field, checked) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    const currentValue = Boolean(item[field]);
    if (currentValue === checked) {
      return;
    }

    setItems((prev) => prev.map((entry) => (entry.id === id ? {
      ...entry,
      [field]: checked,
    } : entry)));

    setStatus(id, 'saving');

    const success = await handleSaveRow(id, { [field]: checked });
    if (!success) {
      setItems((prev) => prev.map((entry) => (entry.id === id ? {
        ...entry,
        [field]: currentValue,
      } : entry)));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDietMenu(false);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'saving':
        return (
          <div className="d-flex justify-content-center">
            <Spinner animation="border" size="sm" />
          </div>
        );
      case 'saved':
        return <Badge bg="success" pill>Saved</Badge>;
      case 'dirty':
        return <Badge bg="warning" text="dark" pill>Unsaved</Badge>;
      case 'error':
        return <Badge bg="danger" pill>Error</Badge>;
      default:
        return <Badge bg="secondary" pill>Up to date</Badge>;
    }
  };

  return (
    <Container className="py-5">
      <Row className="align-items-center mb-4">
        <Col>
          <h1 className="fw-bold mb-1">Diet-Based Menu Management</h1>
          <p className="text-muted mb-0">
            Fine-tune nutritional targets and mark which health goals each meal supports. Changes save automatically.
          </p>
        </Col>
        <Col md="auto" className="mt-3 mt-md-0 d-flex gap-2">
          <Badge bg="primary" pill className="align-self-center">
            {items.length} items
          </Badge>
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            {refreshing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Refreshing
              </>
            ) : 'Refresh data'}
          </Button>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3 mb-4">
            <Col md={4} sm={6} xs={12}>
              <Form.Label className="fw-semibold">Search menu items</Form.Label>
              <Form.Control
                placeholder="Search by name or restaurant"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Label className="fw-semibold">Filter by restaurant</Form.Label>
              <Form.Select
                value={restaurantFilter}
                onChange={(event) => setRestaurantFilter(event.target.value)}
              >
                <option value="">All restaurants</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.value} value={restaurant.value}>
                    {restaurant.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} sm={6} xs={12}>
              <Form.Label className="fw-semibold">Filter by diet goal</Form.Label>
              <Form.Select
                value={goalFilter}
                onChange={(event) => setGoalFilter(event.target.value)}
              >
                {goalFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="py-5 text-center">
              <Spinner animation="border" role="status" />
            </div>
          ) : error ? (
            <Alert variant="danger" className="mb-0">
              {error}
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: '220px' }}>Menu Item</th>
                    <th style={{ minWidth: '160px' }}>Restaurant</th>
                    <th style={{ minWidth: '120px' }}>Calories</th>
                    <th style={{ minWidth: '120px' }}>Protein (g)</th>
                    <th style={{ minWidth: '120px' }}>Carbs (g)</th>
                    <th style={{ minWidth: '120px' }}>Fats (g)</th>
                    <th style={{ minWidth: '170px' }}>Diet suitability</th>
                    <th className="text-center" style={{ width: '120px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-muted">
                        No menu items match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const draft = drafts[item.id] || {
                        calories: '',
                        protein: '',
                        carbs: '',
                        fats: '',
                      };
                      const status = rowStatus[item.id] || 'idle';

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-muted small">ID #{item.id}</div>
                          </td>
                          <td className="text-muted">
                            {item.restaurant?.name || '—'}
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={draft.calories}
                              onChange={(event) => handleMacroChange(item.id, 'calories', event.target.value)}
                              onBlur={() => handleMacroBlur(item.id)}
                              onKeyDown={(event) => handleMacroKeyDown(event, item.id)}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={draft.protein}
                              onChange={(event) => handleMacroChange(item.id, 'protein', event.target.value)}
                              onBlur={() => handleMacroBlur(item.id)}
                              onKeyDown={(event) => handleMacroKeyDown(event, item.id)}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={draft.carbs}
                              onChange={(event) => handleMacroChange(item.id, 'carbs', event.target.value)}
                              onBlur={() => handleMacroBlur(item.id)}
                              onKeyDown={(event) => handleMacroKeyDown(event, item.id)}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={draft.fats}
                              onChange={(event) => handleMacroChange(item.id, 'fats', event.target.value)}
                              onBlur={() => handleMacroBlur(item.id)}
                              onKeyDown={(event) => handleMacroKeyDown(event, item.id)}
                              placeholder="—"
                            />
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <Form.Check
                                type="switch"
                                id={`weight-loss-${item.id}`}
                                label="Weight loss"
                                checked={Boolean(item.is_weight_loss)}
                                onChange={(event) => handleToggle(item.id, 'is_weight_loss', event.target.checked)}
                              />
                              <Form.Check
                                type="switch"
                                id={`weight-gain-${item.id}`}
                                label="Weight gain"
                                checked={Boolean(item.is_weight_gain)}
                                onChange={(event) => handleToggle(item.id, 'is_weight_gain', event.target.checked)}
                              />
                              <Form.Check
                                type="switch"
                                id={`maintenance-${item.id}`}
                                label="Maintenance"
                                checked={Boolean(item.is_maintenance)}
                                onChange={(event) => handleToggle(item.id, 'is_maintenance', event.target.checked)}
                              />
                            </div>
                          </td>
                          <td className="text-center">
                            {renderStatusBadge(status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDietMenu;
