import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Restaurants from './Restaurants';
import List from './Restaurants/List';
import Form from './Restaurants/Form';
import Detail from './Restaurants/Detail';

const AdminRestaurants = () => {
  return (
    <Routes>
      <Route path="/" element={<Restaurants />}>
        <Route index element={<List />} />
        <Route path="new" element={<Form />} />
        <Route path=":id" element={<Detail />} />
        <Route path=":id/edit" element={<Form />} />
      </Route>
    </Routes>
  );
};

export default AdminRestaurants;
  const [savingMenuItem, setSavingMenuItem] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');
  const [deletingMenuItemId, setDeletingMenuItemId] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [menuImageRemoved, setMenuImageRemoved] = useState(false);
  const [restaurantImageFile, setRestaurantImageFile] = useState(null);
  const [restaurantCoverFile, setRestaurantCoverFile] = useState(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState('');
  const [restaurantCoverPreview, setRestaurantCoverPreview] = useState('');
  const [restaurantImageRemoved, setRestaurantImageRemoved] = useState(false);
  const [restaurantCoverRemoved, setRestaurantCoverRemoved] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [filters.status, pagination.current_page]);

  const fetchRestaurants = async (page = pagination.current_page, overrides = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: 10,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...overrides,
      };

      const response = await adminAPI.getRestaurants(params);
      const payload = response.data?.data;
      setRestaurants(payload?.data || []);
      setPagination({
        current_page: payload?.current_page || 1,
        last_page: payload?.last_page || 1,
      });

      if (!selectedRestaurantId && payload?.data?.length) {
        await handleSelectRestaurant(payload.data[0].id);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load restaurants';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId) => {
    if (!restaurantId) {
      setMenuItems([]);
      setMenuCategories([]);
      return;
    }

    setMenuLoading(true);
    setMenuError('');
    try {
      const [menuResponse, categoryResponse] = await Promise.all([
        adminAPI.getRestaurantMenuItems(restaurantId),
        categoryAPI.getAll(),
      ]);

      setMenuItems(menuResponse.data?.data || []);

      const categories = categoryResponse.data?.data || [];
      setMenuCategories(categories);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load menu items';
      setMenuError(message);
      toast.error(message);
      setMenuItems([]);
      setMenuCategories([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurantId) => {
    if (!restaurantId) {
      setSelectedRestaurantId(null);
      setRestaurantDetails(null);
      setEditForm(null);
      setMenuItems([]);
      setMenuCategories([]);
      return;
    }

    setSelectedRestaurantId(restaurantId);
    setDetailsLoading(true);
    try {
      const [restaurantResponse, menuResponse, categoryResponse] = await Promise.all([
        restaurantAPI.getById(restaurantId),
        adminAPI.getRestaurantMenuItems(restaurantId),
        categoryAPI.getAll(),
      ]);
      const data = restaurantResponse.data?.data;
      setRestaurantDetails(data);

      const openingHours = {
        ...emptyOpeningHours,
        ...(data?.opening_hours || {}),
      };

      setEditForm({
        name: data?.name || '',
        description: data?.description || '',
        phone: data?.phone || '',
        email: data?.email || '',
        address: data?.address || '',
        latitude: data?.latitude || '',
        longitude: data?.longitude || '',
        delivery_fee: data?.delivery_fee || 0,
        delivery_time: data?.delivery_time || 30,
        minimum_order: data?.minimum_order || 0,
        status: data?.status || 'inactive',
        is_featured: !!data?.is_featured,
        opening_hours: openingHours,
      });
      setRestaurantImagePreview(data?.image_url || getImageUrl(data?.image) || '');
      setRestaurantCoverPreview(data?.cover_image_url || getImageUrl(data?.cover_image) || '');
      setRestaurantImageFile(null);
      setRestaurantCoverFile(null);
      setRestaurantImageRemoved(false);
      setRestaurantCoverRemoved(false);
      const menuItemsData = menuResponse.data?.data || [];
      setMenuItems(menuItemsData);
      const categories = categoryResponse.data?.data || [];
      setMenuCategories(categories);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load restaurant details';
      toast.error(message);
    } finally {
      setDetailsLoading(false);
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
    fetchRestaurants(1, { search: filters.search });
  };

  const handleRestaurantFieldChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpeningHourChange = (day, key, value) => {
    setEditForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [key]: value,
        },
      },
    }));
  };

  const handleRestaurantImageChange = (type, file) => {
    if (type === 'image') {
      setRestaurantImageFile(file || null);
      setRestaurantImagePreview(file ? URL.createObjectURL(file) : restaurantDetails?.image_url || getImageUrl(restaurantDetails?.image) || '');
      setRestaurantImageRemoved(!file);
    } else {
      setRestaurantCoverFile(file || null);
      setRestaurantCoverPreview(file ? URL.createObjectURL(file) : restaurantDetails?.cover_image_url || getImageUrl(restaurantDetails?.cover_image) || '');
      setRestaurantCoverRemoved(!file);
    }
  };

  const handleRemoveRestaurantImage = (type) => {
    if (type === 'image') {
      setRestaurantImageFile(null);
      setRestaurantImagePreview('');
      setRestaurantImageRemoved(true);
    } else {
      setRestaurantCoverFile(null);
      setRestaurantCoverPreview('');
      setRestaurantCoverRemoved(true);
    }
  };

  const handleSaveRestaurant = async () => {
    if (!selectedRestaurantId || !editForm) return;
    setSavingRestaurant(true);
    try {
      const formData = new FormData();
      const plainFields = {
        name: editForm.name,
        description: editForm.description,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        status: editForm.status,
      };

      const numericFields = {
        delivery_fee: editForm.delivery_fee,
        delivery_time: editForm.delivery_time,
        minimum_order: editForm.minimum_order,
        latitude: editForm.latitude,
        longitude: editForm.longitude,
      };

      Object.entries(plainFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      Object.entries(numericFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
        }
      });

      Object.entries(editForm.opening_hours || {}).forEach(([day, schedule]) => {
        const daySchedule = schedule || {};
        if (daySchedule.open !== undefined && daySchedule.open !== '') {
          formData.append(`opening_hours[${day}][open]`, daySchedule.open);
        }
        if (daySchedule.close !== undefined && daySchedule.close !== '') {
          formData.append(`opening_hours[${day}][close]`, daySchedule.close);
        }
      });

      if (restaurantImageFile) {
        formData.append('image', restaurantImageFile);
      } else if (restaurantImageRemoved) {
        formData.append('remove_image', '1');
      }

      if (restaurantCoverFile) {
        formData.append('cover_image', restaurantCoverFile);
      } else if (restaurantCoverRemoved) {
        formData.append('remove_cover_image', '1');
      }

      await restaurantAPI.update(selectedRestaurantId, formData);
      toast.success('Restaurant updated successfully');
      await handleSelectRestaurant(selectedRestaurantId);
      await fetchRestaurants(pagination.current_page);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update restaurant';
      toast.error(message);
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!selectedRestaurantId) return;
    setSavingStatus(true);
    try {
      await adminAPI.toggleFeatured(selectedRestaurantId);
      toast.success('Featured status updated');
      await handleSelectRestaurant(selectedRestaurantId);
      await fetchRestaurants(pagination.current_page);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to toggle featured status';
      toast.error(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedRestaurantId) return;
    setSavingStatus(true);
    try {
      await adminAPI.updateRestaurantStatus(selectedRestaurantId, { status });
      toast.success(`Restaurant marked as ${status}`);
      await handleSelectRestaurant(selectedRestaurantId);
      await fetchRestaurants(pagination.current_page);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update restaurant status';
      toast.error(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const openPriceModal = (menuItem) => {
    setPriceModal({
      show: true,
      item: menuItem,
      form: {
        price: menuItem.price ?? 0,
        discount_price: menuItem.discount_price ?? '',
        is_available: menuItem.is_available ? '1' : '0',
      },
    });
  };

  const closePriceModal = () => {
    setPriceModal((prev) => ({
      show: false,
      item: null,
      form: {
        price: '',
        discount_price: '',
        is_available: '1',
      },
    }));
  };

  const openMenuModal = (mode = 'create', menuItem = null) => {
    if (mode === 'edit' && menuItem) {
      setMenuModal({
        show: true,
        mode: 'edit',
        item: menuItem,
        form: {
          name: menuItem.name || '',
          description: menuItem.description || '',
          price: menuItem.price !== null && menuItem.price !== undefined ? Number(menuItem.price).toString() : '',
          discount_price:
            menuItem.discount_price !== null && menuItem.discount_price !== undefined
              ? Number(menuItem.discount_price).toString()
              : '',
          is_available: menuItem.is_available ? '1' : '0',
          is_featured: menuItem.is_featured ? '1' : '0',
          preparation_time:
            menuItem.preparation_time !== null && menuItem.preparation_time !== undefined
              ? Number(menuItem.preparation_time).toString()
              : '',
          sort_order:
            menuItem.sort_order !== null && menuItem.sort_order !== undefined
              ? Number(menuItem.sort_order).toString()
              : '',
          category_id: menuItem.category_id ? String(menuItem.category_id) : menuCategories[0]?.id ?? '',
        },
      });
      setMenuImageFile(null);
      setMenuImagePreview(getImageUrl(menuItem.image) || '');
      setMenuImageRemoved(false);
    } else {
      setMenuModal({
        show: true,
        mode: 'create',
        item: null,
        form: { ...defaultMenuFormState, category_id: menuCategories[0]?.id ? String(menuCategories[0].id) : '' },
      });
      setMenuImageFile(null);
      setMenuImagePreview('');
      setMenuImageRemoved(false);
    }
  };

  const closeMenuModal = () => {
    setMenuModal({
      show: false,
      mode: 'create',
      item: null,
      form: { ...defaultMenuFormState },
    });
    setMenuImageFile(null);
    setMenuImagePreview('');
    setMenuImageRemoved(false);
  };

  const handleMenuFormChange = (field, value) => {
    setMenuModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const handleMenuImageSelect = (file) => {
    if (!file) return;
    setMenuImageFile(file);
    setMenuImagePreview(URL.createObjectURL(file));
    setMenuImageRemoved(false);
  };

  const handleMenuImageRemove = () => {
    setMenuImageFile(null);
    setMenuImagePreview('');
    setMenuImageRemoved(true);
  };

  const handlePriceFormChange = (field, value) => {
    setPriceModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const handleSubmitMenuItem = async (event) => {
    event?.preventDefault();
    if (!selectedRestaurantId) return;

    const { form, mode, item } = menuModal;
    const hasPrice = form.price !== '' && !Number.isNaN(Number(form.price));
    const categoryId = form.category_id ? Number(form.category_id) : null;

    if (!form.name.trim() || !hasPrice || !categoryId) {
      toast.error('Please provide a valid name, price, and category for the menu item.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category_id', String(categoryId));
    formData.append('price', String(Number(form.price)));

    formData.append('is_available', form.is_available === '1' ? '1' : '0');
    formData.append('is_featured', form.is_featured === '1' ? '1' : '0');

    if (form.description) formData.append('description', form.description);
    if (form.discount_price !== '') formData.append('discount_price', String(Number(form.discount_price)));
    if (form.preparation_time !== '') formData.append('preparation_time', String(Number(form.preparation_time)));
    if (form.sort_order !== '') formData.append('sort_order', String(Number(form.sort_order)));
    if (menuImageFile) {
      formData.append('image', menuImageFile);
    } else if (mode === 'edit' && menuImageRemoved) {
      formData.append('remove_image', '1');
    }

    setSavingMenuItem(true);
    try {
      if (mode === 'edit' && item) {
        await adminAPI.updateMenuItem(selectedRestaurantId, item.id, formData);
        toast.success('Menu item updated successfully');
      } else {
        await adminAPI.createMenuItem(selectedRestaurantId, formData);
        toast.success('Menu item created successfully');
      }

      closeMenuModal();
      await fetchMenuItems(selectedRestaurantId);
      await handleSelectRestaurant(selectedRestaurantId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save menu item';
      toast.error(message);
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (menuItemId) => {
    if (!selectedRestaurantId || !menuItemId) return;

    const confirmDelete = window.confirm('Delete this menu item? This action cannot be undone.');
    if (!confirmDelete) return;

    setDeletingMenuItemId(menuItemId);
    try {
      await adminAPI.deleteMenuItem(selectedRestaurantId, menuItemId);
      toast.success('Menu item deleted successfully');
      await fetchMenuItems(selectedRestaurantId);
      await handleSelectRestaurant(selectedRestaurantId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete menu item';
      toast.error(message);
    } finally {
      setDeletingMenuItemId(null);
    }
  };

  const handleSubmitPrice = async () => {
    if (!priceModal.item) return;

    setSavingPrice(true);
    try {
      const payload = {
        price: Number(priceModal.form.price) || 0,
        discount_price:
          priceModal.form.discount_price !== ''
            ? Number(priceModal.form.discount_price)
            : null,
        is_available: priceModal.form.is_available === '1',
      };

      await adminAPI.updateMenuItemPrice(priceModal.item.id, payload);
      toast.success('Menu item price updated');
      closePriceModal();
      await fetchMenuItems(selectedRestaurantId);
      await handleSelectRestaurant(selectedRestaurantId);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update menu item price';
      toast.error(message);
    } finally {
      setSavingPrice(false);
    }
  };

  const restaurantStatusBadge = useMemo(() => ({
    active: 'success',
    inactive: 'secondary',
    closed: 'dark',
  }), []);

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        <Col xl={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
                <div>
                  <h3 className="mb-0">Restaurants</h3>
                  <small className="text-muted">Manage profiles, locations, and visibility</small>
                </div>
                <Form onSubmit={handleSearchSubmit} className="d-flex gap-2">
                  <Form.Control
                    type="search"
                    placeholder="Search by name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <Button type="submit" variant="outline-primary">Search</Button>
                </Form>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="px-3 py-3 border-bottom bg-light">
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {restaurantStatuses.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
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
                        <th style={{ width: '110px' }}>Thumbnail</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No restaurants found
                          </td>
                        </tr>
                      ) : (
                        restaurants.map((rest) => (
                          <tr key={rest.id} className={rest.id === selectedRestaurantId ? 'table-primary' : ''}>
                            <td style={{ width: '110px' }}>
                              <div
                                className="bg-white d-flex align-items-center justify-content-center rounded shadow-sm"
                                style={{ width: '100px', height: '75px', overflow: 'hidden', border: '1px solid #edf2f7' }}
                              >
                                {rest.image_url || getImageUrl(rest.image) ? (
                                  <Image
                                    src={rest.image_url || getImageUrl(rest.image)}
                                    alt={rest.name}
                                    style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.04) saturate(1.04)' }}
                                  />
                                ) : (
                                  <span className="text-muted small">No image</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="fw-semibold">{rest.name}</div>
                              <div className="text-muted small">
                                {rest.address || 'Address not provided'}
                              </div>
                              <div className="mt-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleSelectRestaurant(rest.id)}
                                >
                                  Manage
                                </Button>
                              </div>
                            </td>
                            <td>
                              <Badge bg={restaurantStatusBadge[rest.status] || 'secondary'}>
                                {rest.status?.toUpperCase() || 'N/A'}
                              </Badge>
                            </td>
                            <td>{rest.owner?.name || '—'}</td>
                            <td>{rest.orders_count ?? rest.orders?.length ?? '-'}</td>
                          </tr>
                        ))
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
                    fetchRestaurants(nextPage);
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
                    fetchRestaurants(nextPage);
                  }}
                >
                  Next
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">Restaurant Profile</h3>
                  <small className="text-muted">Update location, contact, and operating hours</small>
                </div>
                {restaurantDetails && (
                  <Badge bg={restaurantDetails.is_featured ? 'warning' : 'secondary'}>
                    {restaurantDetails.is_featured ? 'Featured' : 'Standard'}
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {detailsLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : !restaurantDetails ? (
                <div className="text-center text-muted py-5">
                  Select a restaurant to manage its details
                </div>
              ) : (
                <Form>
                  <Row className="g-4">
                    <Col md={6}>
                      <Form.Group controlId="restaurantName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          value={editForm?.name || ''}
                          onChange={(e) => handleRestaurantFieldChange('name', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantPhone">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          value={editForm?.phone || ''}
                          onChange={(e) => handleRestaurantFieldChange('phone', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={editForm?.email || ''}
                          onChange={(e) => handleRestaurantFieldChange('email', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantOwner">
                        <Form.Label>Owner</Form.Label>
                        <Form.Control value={restaurantDetails.owner?.name || '—'} disabled />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group controlId="restaurantAddress">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editForm?.address || ''}
                          onChange={(e) => handleRestaurantFieldChange('address', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantLatitude">
                        <Form.Label>Latitude</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.000001"
                          value={editForm?.latitude || ''}
                          onChange={(e) => handleRestaurantFieldChange('latitude', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantLongitude">
                        <Form.Label>Longitude</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.000001"
                          value={editForm?.longitude || ''}
                          onChange={(e) => handleRestaurantFieldChange('longitude', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="restaurantDeliveryFee">
                        <Form.Label>Delivery Fee ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={editForm?.delivery_fee}
                          onChange={(e) => handleRestaurantFieldChange('delivery_fee', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="restaurantDeliveryTime">
                        <Form.Label>Delivery Time (mins)</Form.Label>
                        <Form.Control
                          type="number"
                          value={editForm?.delivery_time}
                          onChange={(e) => handleRestaurantFieldChange('delivery_time', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="restaurantMinimumOrder">
                        <Form.Label>Minimum Order ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={editForm?.minimum_order}
                          onChange={(e) => handleRestaurantFieldChange('minimum_order', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group controlId="restaurantDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editForm?.description || ''}
                          onChange={(e) => handleRestaurantFieldChange('description', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantImage">
                        <Form.Label>Restaurant Thumbnail</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="bg-white d-flex align-items-center justify-content-center rounded shadow-sm"
                            style={{ width: '120px', height: '90px', overflow: 'hidden', border: '1px solid #edf2f7' }}
                          >
                            {restaurantImagePreview ? (
                              <Image
                                src={restaurantImagePreview}
                                alt="Restaurant thumbnail"
                                style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.04) saturate(1.04)' }}
                              />
                            ) : (
                              <span className="text-muted small">No image</span>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleRestaurantImageChange('image', event.target.files?.[0] || null)}
                            />
                            {(restaurantImagePreview || restaurantDetails?.image_url) && (
                              <Button
                                variant="link"
                                className="p-0 mt-1"
                                onClick={() => handleRemoveRestaurantImage('image')}
                              >
                                Remove image
                              </Button>
                            )}
                          </div>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="restaurantCoverImage">
                        <Form.Label>Cover Image</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="bg-white d-flex align-items-center justify-content-center rounded shadow-sm"
                            style={{ width: '160px', height: '90px', overflow: 'hidden', border: '1px solid #edf2f7' }}
                          >
                            {restaurantCoverPreview ? (
                              <Image
                                src={restaurantCoverPreview}
                                alt="Restaurant cover"
                                style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.04) saturate(1.04)' }}
                              />
                            ) : (
                              <span className="text-muted small">No cover image</span>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleRestaurantImageChange('cover', event.target.files?.[0] || null)}
                            />
                            {(restaurantCoverPreview || restaurantDetails?.cover_image_url) && (
                              <Button
                                variant="link"
                                className="p-0 mt-1"
                                onClick={() => handleRemoveRestaurantImage('cover')}
                              >
                                Remove cover image
                              </Button>
                            )}
                          </div>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <h5 className="mb-3">Opening Hours</h5>
                    <Row className="g-3">
                      {daysOfWeek.map((day) => (
                        <Col md={6} key={day}>
                          <div className="border rounded p-3">
                            <div className="text-capitalize fw-semibold mb-2">{day}</div>
                            <Row className="g-2">
                              <Col>
                                <Form.Label className="small mb-1">Open</Form.Label>
                                <Form.Control
                                  type="time"
                                  value={editForm?.opening_hours?.[day]?.open || ''}
                                  onChange={(e) => handleOpeningHourChange(day, 'open', e.target.value)}
                                />
                              </Col>
                              <Col>
                                <Form.Label className="small mb-1">Close</Form.Label>
                                <Form.Control
                                  type="time"
                                  value={editForm?.opening_hours?.[day]?.close || ''}
                                  onChange={(e) => handleOpeningHourChange(day, 'close', e.target.value)}
                                />
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mt-4 gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <Form.Select
                        value={editForm?.status}
                        onChange={(e) => handleRestaurantFieldChange('status', e.target.value)}
                        style={{ maxWidth: '220px' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="closed">Closed</option>
                      </Form.Select>
                      <Button
                        variant="outline-warning"
                        onClick={handleToggleFeatured}
                        disabled={savingStatus}
                      >
                        {restaurantDetails.is_featured ? 'Remove Featured' : 'Mark Featured'}
                      </Button>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <ButtonGroup>
                        {['active', 'inactive', 'closed'].map((status) => (
                          <Button
                            key={status}
                            variant={editForm?.status === status ? 'primary' : 'outline-primary'}
                            onClick={() => handleStatusUpdate(status)}
                            disabled={savingStatus || editForm?.status === status}
                          >
                            {status.toUpperCase()}
                          </Button>
                        ))}
                      </ButtonGroup>
                      <Button
                        variant="primary"
                        onClick={handleSaveRestaurant}
                        disabled={savingRestaurant}
                      >
                        {savingRestaurant ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Menu Items</h3>
                <small className="text-muted">
                  Adjust pricing and availability for each item
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                {restaurantDetails && (
                  <Badge bg="primary">{menuItems.length} items</Badge>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openMenuModal('create')}
                  disabled={!selectedRestaurantId}
                >
                  Add Menu Item
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {detailsLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : !restaurantDetails ? (
                <div className="text-center text-muted py-5">
                  Select a restaurant to manage its menu
                </div>
              ) : menuLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : menuError ? (
                <Alert variant="danger" className="m-3 mb-0">
                  {menuError}
                </Alert>
              ) : menuItems.length ? (
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '90px' }}>Image</th>
                        <th>Name</th>
                        <th style={{ width: '120px' }}>Price</th>
                        <th style={{ width: '140px' }}>Discount</th>
                        <th style={{ width: '150px' }}>Availability</th>
                        <th style={{ width: '200px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ width: '110px' }}>
                            <div
                              className="bg-white d-flex align-items-center justify-content-center rounded shadow-sm"
                              style={{ width: '100px', height: '75px', overflow: 'hidden', border: '1px solid #edf2f7' }}
                            >
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.05)' }}
                                />
                              ) : getImageUrl(item.image) ? (
                                <Image
                                  src={getImageUrl(item.image)}
                                  alt={item.name}
                                  style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.05)' }}
                                />
                              ) : (
                                <span className="text-muted small">No image</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{item.name}</div>
                            <div className="text-muted small">{item.category?.name || 'Uncategorised'}</div>
                            {item.description && (
                              <div className="text-muted small mt-1">{item.description}</div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">
                              ${Number(item.price ?? 0).toFixed(2)}
                            </div>
                          </td>
                          <td>
                            {item.discount_price !== null && item.discount_price !== undefined && item.discount_price !== '' ? (
                              <span>${Number(item.discount_price).toFixed(2)}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <Badge bg={item.is_available ? 'success' : 'secondary'}>
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <Button size="sm" variant="outline-secondary" onClick={() => openMenuModal('edit', item)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline-primary" onClick={() => openPriceModal(item)}>
                                Edit Price
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteMenuItem(item.id)}
                                disabled={deletingMenuItemId === item.id}
                              >
                                {deletingMenuItemId === item.id ? 'Deleting…' : 'Delete'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  No menu items found for this restaurant.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Modal show={priceModal.show} onHide={closePriceModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Menu Item Price</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {priceModal.item ? (
            <Form>
              <div className="mb-3">
                <Form.Label>Menu Item</Form.Label>
                <Form.Control value={priceModal.item.name} disabled />
              </div>
              <div className="mb-3">
                <Form.Label>Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceModal.form.price}
                  onChange={(e) => handlePriceFormChange('price', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <Form.Label>Discount Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceModal.form.discount_price}
                  onChange={(e) => handlePriceFormChange('discount_price', e.target.value)}
                  placeholder="Leave blank for none"
                />
              </div>
              <div className="mb-3">
                <Form.Label>Availability</Form.Label>
                <Form.Select
                  value={priceModal.form.is_available}
                  onChange={(e) => handlePriceFormChange('is_available', e.target.value)}
                >
                  <option value="1">Available</option>
                  <option value="0">Unavailable</option>
                </Form.Select>
              </div>
            </Form>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePriceModal} disabled={savingPrice}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitPrice} disabled={savingPrice}>
            {savingPrice ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={menuModal.show} onHide={closeMenuModal} centered>
        <Form onSubmit={handleSubmitMenuItem}>
          <Modal.Header closeButton>
            <Modal.Title>{menuModal.mode === 'edit' ? 'Edit Menu Item' : 'Add Menu Item'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                value={menuModal.form.name}
                onChange={(e) => handleMenuFormChange('name', e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={menuModal.form.category_id}
                onChange={(e) => handleMenuFormChange('category_id', e.target.value)}
                required
                disabled={!menuCategories.length}
              >
                {menuCategories.length ? (
                  menuCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option value="">No categories available</option>
                )}
              </Form.Select>
              {!menuCategories.length && (
                <Form.Text className="text-muted">
                  Create categories first before adding menu items.
                </Form.Text>
              )}
            </div>
            <div className="mb-3">
              <Form.Label>Menu Image</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="bg-white d-flex align-items-center justify-content-center rounded shadow-sm"
                  style={{ width: '110px', height: '82px', overflow: 'hidden', border: '1px solid #edf2f7' }}
                >
                  {menuImagePreview ? (
                    <Image
                      src={menuImagePreview}
                      alt="Preview"
                      style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.05)' }}
                    />
                  ) : (!menuImageRemoved && (menuModal.item?.image_url || getImageUrl(menuModal.item?.image))) ? (
                    <Image
                      src={menuModal.item?.image_url || getImageUrl(menuModal.item?.image)}
                      alt={menuModal.item?.name || 'Menu item'}
                      style={{ width: '110%', height: '110%', objectFit: 'cover', filter: 'contrast(1.05) saturate(1.05)' }}
                    />
                  ) : (
                    <span className="text-muted small">No image</span>
                  )}
                </div>
                <div className="flex-grow-1">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleMenuImageSelect(event.target.files?.[0] || null)}
                  />
                  {(menuImagePreview || (menuModal.item?.image && !menuImageRemoved)) && (
                    <Button
                      variant="link"
                      className="p-0 mt-1"
                      onClick={handleMenuImageRemove}
                    >
                      Remove image
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={menuModal.form.description}
                onChange={(e) => handleMenuFormChange('description', e.target.value)}
              />
            </div>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="menuItemPrice">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuModal.form.price}
                    onChange={(e) => handleMenuFormChange('price', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="menuItemDiscount">
                  <Form.Label>Discount Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuModal.form.discount_price}
                    onChange={(e) => handleMenuFormChange('discount_price', e.target.value)}
                    placeholder="Leave blank for none"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3 mt-1">
              <Col md={6}>
                <Form.Group controlId="menuItemAvailability">
                  <Form.Label>Availability</Form.Label>
                  <Form.Select
                    value={menuModal.form.is_available}
                    onChange={(e) => handleMenuFormChange('is_available', e.target.value)}
                  >
                    <option value="1">Available</option>
                    <option value="0">Unavailable</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="menuItemFeatured">
                  <Form.Label>Featured</Form.Label>
                  <Form.Select
                    value={menuModal.form.is_featured}
                    onChange={(e) => handleMenuFormChange('is_featured', e.target.value)}
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-3 mt-1">
              <Col md={6}>
                <Form.Group controlId="menuItemPrepTime">
                  <Form.Label>Preparation Time (mins)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={menuModal.form.preparation_time}
                    onChange={(e) => handleMenuFormChange('preparation_time', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="menuItemSortOrder">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={menuModal.form.sort_order}
                    onChange={(e) => handleMenuFormChange('sort_order', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeMenuModal} disabled={savingMenuItem}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingMenuItem || !menuCategories.length}>
              {savingMenuItem ? 'Saving...' : menuModal.mode === 'edit' ? 'Save Changes' : 'Create Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminRestaurants;
