import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
  ButtonGroup,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const roles = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Customer', value: 'customer' },
  { label: 'Restaurant Owner', value: 'restaurant_owner' },
  { label: 'Driver', value: 'driver' },
  { label: 'Staff (POS)', value: 'staff' },
];

const statuses = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
  });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status, pagination.current_page]);

  const fetchUsers = async (page = pagination.current_page, overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: 10,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...overrides,
      };

      const response = await adminAPI.getUsers(params);
      const payload = response.data?.data;
      setUsers(payload?.data || []);
      setPagination({
        current_page: payload?.current_page || 1,
        last_page: payload?.last_page || 1,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load users';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setPagination((prev) => ({ ...prev, current_page: 1 }));
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchUsers(1, { search: filters.search });
  };

  const handleStatusUpdate = async (userId, status) => {
    setUpdatingUserId(userId);
    try {
      await adminAPI.updateUserStatus(userId, { status });
      toast.success('User status updated');
      await fetchUsers();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmDelete) return;

    setDeletingUserId(userId);
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const statusVariant = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'warning',
  };

  const renderUsersTable = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger" className="m-3">
          {error}
        </Alert>
      );
    }

    if (!users.length) {
      return (
        <div className="text-center text-muted py-5">
          No users found for the selected filters.
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table hover className="align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ width: '220px' }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="fw-semibold">{user.name || '—'}</div>
                  <div className="text-muted small">ID: {user.id}</div>
                </td>
                <td>{user.email}</td>
                <td className="text-capitalize">{user.role?.replace('_', ' ') || '—'}</td>
                <td>
                  <Badge bg={statusVariant[user.status] || 'secondary'}>{user.status || 'unknown'}</Badge>
                </td>
                <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                <td className="text-end">
                  <div className="d-flex justify-content-end gap-2 flex-wrap">
                    <ButtonGroup size="sm">
                      {['active', 'inactive', 'suspended'].map((status) => (
                        <Button
                          key={`${user.id}-${status}`}
                          variant={user.status === status ? 'primary' : 'outline-primary'}
                          onClick={() => handleStatusUpdate(user.id, status)}
                          disabled={updatingUserId === user.id || user.status === status}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </ButtonGroup>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        <Col xl={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <h3 className="mb-0">Filters</h3>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSearchSubmit} className="d-flex flex-column gap-3">
                <Form.Group controlId="userSearch">
                  <Form.Label>Search</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="search"
                      placeholder="Search by name, email..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <Button type="submit" variant="primary">
                      Search
                    </Button>
                  </div>
                </Form.Group>

                <Form.Group controlId="userRole">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    {roles.map((option) => (
                      <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="userStatus">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statuses.map((option) => (
                      <option key={option.value || 'all-status'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setFilters({ search: '', role: '', status: '' });
                    setPagination({ current_page: 1, last_page: 1 });
                    fetchUsers(1, { search: '', role: '', status: '' });
                  }}
                  disabled={loading}
                >
                  Reset Filters
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Users</h3>
                <small className="text-muted">Manage roles, statuses, and access</small>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => fetchUsers()} disabled={loading}>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {renderUsersTable()}
            </Card.Body>
            <Card.Footer className="bg-white d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page <= 1 || loading}
                  onClick={() => {
                    const nextPage = pagination.current_page - 1;
                    setPagination((prev) => ({ ...prev, current_page: nextPage }));
                    fetchUsers(nextPage);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page >= pagination.last_page || loading}
                  onClick={() => {
                    const nextPage = pagination.current_page + 1;
                    setPagination((prev) => ({ ...prev, current_page: nextPage }));
                    fetchUsers(nextPage);
                  }}
                >
                  Next
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminUsers;
