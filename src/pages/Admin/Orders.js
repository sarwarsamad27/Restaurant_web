import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Spinner,
  Alert,
  ButtonGroup,
  ListGroup,
  Image,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI, orderAPI } from '../../services/api';

const storageBase = (process.env.REACT_APP_STORAGE_URL || 'http://localhost:8000/storage').replace(/\/$/, '');

const getImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.replace(/^storage\/?/i, '').replace(/^\//, '');
  return `${storageBase}/${normalized}`;
};

const orderStatuses = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const statusBadgeVariant = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  out_for_delivery: 'secondary',
  delivered: 'success',
  cancelled: 'danger',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [filters, setFilters] = useState({ status: '', search: '', from_date: '', to_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters.status, pagination.current_page]);

  const fetchOrders = async (page = pagination.current_page, overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        per_page: 12,
        page,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.from_date ? { from_date: filters.from_date } : {}),
        ...(filters.to_date ? { to_date: filters.to_date } : {}),
        ...overrides,
      };

      const response = await adminAPI.getOrders(params);
      const payload = response.data?.data;
      setOrders(payload?.data || []);
      setPagination({
        current_page: payload?.current_page || 1,
        last_page: payload?.last_page || 1,
      });

      if (!selectedOrderId && payload?.data?.length) {
        handleSelectOrder(payload.data[0]);
      } else if (selectedOrderId) {
        const updated = payload?.data?.find((order) => order.id === selectedOrderId);
        if (updated) {
          setSelectedOrder(updated);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load orders';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    if (!order) {
      setSelectedOrderId(null);
      setSelectedOrder(null);
      return;
    }
    setSelectedOrderId(order.id);
    setSelectedOrder(order);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPagination((prev) => ({ ...prev, current_page: 1 }));
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchOrders(1, { search: filters.search });
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedOrder) return;

    const payload = { status };
    if (status === 'cancelled') {
      const reason = window.prompt('Reason for cancellation?');
      if (!reason) {
        toast.info('Cancellation aborted. Reason required.');
        return;
      }
      payload.cancellation_reason = reason;
    }

    setUpdatingStatus(true);
    try {
      await orderAPI.updateStatus(selectedOrder.id, payload);
      toast.success(`Order marked as ${status}`);
      await fetchOrders(pagination.current_page);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update order status';
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const selectedTimeline = useMemo(() => {
    if (!selectedOrder) return [];
    const timelineMap = {
      pending: selectedOrder.created_at,
      confirmed: selectedOrder.confirmed_at,
      preparing: selectedOrder.preparing_at,
      ready: selectedOrder.ready_at,
      out_for_delivery: selectedOrder.out_for_delivery_at,
      delivered: selectedOrder.delivered_at,
      cancelled: selectedOrder.cancelled_at,
    };

    return orderStatuses
      .filter((status) => timelineMap[status])
      .map((status) => ({
        status,
        timestamp: timelineMap[status],
      }));
  }, [selectedOrder]);

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        <Col xl={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
                <div>
                  <h3 className="mb-0">Orders</h3>
                  <small className="text-muted">Track, update, and manage customer orders</small>
                </div>
                <Form onSubmit={handleSearchSubmit} className="d-flex gap-2">
                  <Form.Control
                    type="search"
                    placeholder="Search by order #"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">Search</Button>
                </Form>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="px-3 py-3 border-bottom bg-light d-flex gap-2 flex-wrap">
                <Form.Select
                  style={{ maxWidth: '200px' }}
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                />
                <Form.Control
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                />
                <Button
                  variant="link"
                  className="text-decoration-none"
                  onClick={() => {
                    setFilters({ status: '', search: '', from_date: '', to_date: '' });
                    fetchOrders(1, { status: '', search: '', from_date: '', to_date: '' });
                  }}
                >
                  Reset
                </Button>
              </div>

              {error && (
                <Alert variant="danger" className="m-3">
                  {error}
                </Alert>
              )}

              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Restaurant</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const itemCount = order.items?.reduce(
                            (sum, item) => sum + Number(item.quantity || 0),
                            0
                          );

                          return (
                            <tr key={order.id} className={order.id === selectedOrderId ? 'table-primary' : ''}>
                              <td>
                                <div className="fw-semibold">#{order.order_number || order.id}</div>
                                <div className="text-muted small">
                                  {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                                </div>
                              </td>
                              <td>
                                <div>{order.user?.name || 'Guest'}</div>
                                <div className="text-muted small">{order.user?.email || '—'}</div>
                              </td>
                              <td>{order.restaurant?.name || '—'}</td>
                              <td>
                                <Badge bg={statusBadgeVariant[order.status] || 'secondary'}>
                                  {order.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                                </Badge>
                              </td>
                              <td>
                                <div className="fw-semibold">${Number(order.total || 0).toFixed(2)}</div>
                                <div className="text-muted small">
                                  {itemCount || 0} item{itemCount === 1 ? '' : 's'}
                                </div>
                              </td>
                              <td className="text-end">
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleSelectOrder(order)}
                                >
                                  View
                                </Button>
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
            <Card.Footer className="bg-white d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page <= 1}
                  onClick={() => {
                    const nextPage = pagination.current_page - 1;
                    setPagination((prev) => ({ ...prev, current_page: nextPage }));
                    fetchOrders(nextPage);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => {
                    const nextPage = pagination.current_page + 1;
                    setPagination((prev) => ({ ...prev, current_page: nextPage }));
                    fetchOrders(nextPage);
                  }}
                >
                  Next
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Order Details</h3>
                <small className="text-muted">Update status and review fulfilment info</small>
              </div>
              {selectedOrder && (
                <Badge bg={statusBadgeVariant[selectedOrder.status] || 'secondary'}>
                  {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {!selectedOrder ? (
                <div className="text-center text-muted py-5">
                  Select an order to view details
                </div>
              ) : (
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <div className="fw-semibold">Customer</div>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-2">
                          <div className="fw-semibold">{selectedOrder.user?.name || 'Guest'}</div>
                          <div className="text-muted small">{selectedOrder.user?.email || '—'}</div>
                        </div>
                        <div className="text-muted small">{selectedOrder.delivery_address || 'Delivery address not provided'}</div>
                        <div className="text-muted small">Phone: {selectedOrder.customer_phone || selectedOrder.user?.phone || '—'}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <div className="fw-semibold">Restaurant & Driver</div>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-2">
                          <div className="fw-semibold">{selectedOrder.restaurant?.name || '—'}</div>
                          <div className="text-muted small">{selectedOrder.restaurant?.address || 'No address'}</div>
                        </div>
                        <div className="text-muted small">
                          Driver: {selectedOrder.driver?.name || 'Not assigned'}
                        </div>
                        <div className="text-muted small">
                          Payment: {selectedOrder.payment_method?.toUpperCase() || 'N/A'}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <div className="fw-semibold">Order Items</div>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {selectedOrder.items?.map((item) => (
                          <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-3">
                              {getImageUrl(item.menu_item?.image || item.image) ? (
                                <Image
                                  src={getImageUrl(item.menu_item?.image || item.image)}
                                  alt={item.menu_item?.name || item.item_name || 'Menu item'}
                                  rounded
                                  style={{ width: '64px', height: '48px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '64px', height: '48px' }}>
                                  <span className="text-muted small">No image</span>
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold">{item.menu_item?.name || item.item_name || 'Menu item'}</div>
                                <div className="text-muted small">Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <div className="fw-semibold">${Number(item.subtotal || 0).toFixed(2)}</div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                  </Col>

                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-white">
                        <div className="fw-semibold">Timeline</div>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {selectedTimeline.length === 0 ? (
                          <ListGroup.Item className="text-muted">No timeline events recorded yet.</ListGroup.Item>
                        ) : (
                          selectedTimeline.map((step) => (
                            <ListGroup.Item key={step.status} className="d-flex justify-content-between">
                              <span className="text-capitalize">{step.status.replace(/_/g, ' ')}</span>
                              <span className="text-muted">
                                {step.timestamp ? new Date(step.timestamp).toLocaleString() : '—'}
                              </span>
                            </ListGroup.Item>
                          ))
                        )}
                      </ListGroup>
                    </Card>
                  </Col>

                  <Col md={12}>
                    <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
                      <div>
                        <div className="fw-semibold">Order Total</div>
                        <div className="display-6 fw-bold text-primary">${Number(selectedOrder.total || 0).toFixed(2)}</div>
                      </div>
                      <ButtonGroup className="flex-wrap">
                        {orderStatuses.map((status) => (
                          <Button
                            key={status}
                            variant={selectedOrder.status === status ? 'primary' : 'outline-primary'}
                            onClick={() => handleStatusUpdate(status)}
                            disabled={updatingStatus || selectedOrder.status === status}
                            className="text-capitalize"
                          >
                            {status.replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </ButtonGroup>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminOrders;
