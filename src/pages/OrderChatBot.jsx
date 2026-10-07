import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { aiAPI, menuItemAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const OrderChatBot = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi there! Tell me what you would like to order today.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, { id: Date.now(), ...message }]);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    if (!user) {
      toast.info('Please login to place orders.');
      return;
    }

    const userText = input.trim();
    appendMessage({ sender: 'user', text: userText });
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiAPI.chatOrder({ message: userText });

      if (data.order?.items?.length) {
        setPendingOrder(data.order);
      } else {
        setPendingOrder(null);
      }

      appendMessage({
        sender: 'ai',
        text: data.message,
        order: data.order,
        notes: data.notes || [],
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Sorry, something went wrong.';
      appendMessage({ sender: 'ai', text: message });
      setPendingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingOrder) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await aiAPI.confirmChatOrder(pendingOrder);
      const items = data.cart_items || [];

      if (!items.length) {
        toast.info('No items were ready to add to the cart.');
        return;
      }

      for (const item of items) {
        // Fetch the full menu item to ensure we have restaurant data
        const response = await menuItemAPI.getById(item.id);
        const menuItem = response.data.data;
        addToCart(menuItem, item.quantity);
      }

      toast.success('Items added to your cart!');
      appendMessage({ sender: 'ai', text: 'Order confirmed and added to your cart. Anything else?' });
      setPendingOrder(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to confirm the order right now.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderPreview = (order) => {
    if (!order || !order.items?.length) {
      return null;
    }

    return (
      <div className="mt-3">
        <div className="fw-semibold mb-2">Proposed order</div>
        <div className="d-flex flex-column gap-2">
          {order.items.map((item, index) => (
            <div key={`${item.itemId}-${index}`} className="d-flex justify-content-between align-items-center bg-light rounded px-3 py-2">
              <div>
                <div className="fw-semibold">{item.itemName}</div>
                <div className="text-muted small">Quantity: {item.quantity}</div>
              </div>
              <div className="text-muted small">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="fw-bold">Subtotal</div>
          <div className="fw-bold">${Number(order.priceBreakdown).toFixed(2)}</div>
        </div>
      </div>
    );
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-column" style={{ minHeight: '520px' }}>
              <div className="flex-grow-1 mb-3" style={{ overflowY: 'auto' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`d-flex mb-3 ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`chat-bubble px-3 py-2 rounded-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-light text-dark'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      <div>{message.text}</div>
                      {message.notes?.length > 0 && (
                        <div className="mt-2">
                          {message.notes.map((note, idx) => (
                            <div key={idx} className="text-muted small">
                              • {note}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.sender === 'ai' && renderOrderPreview(message.order)}
                    </div>
                  </div>
                ))}
              </div>

              {pendingOrder && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center bg-warning bg-opacity-25 border border-warning rounded-3 px-3 py-2">
                    <div>
                      <div className="fw-semibold">Add this order to cart?</div>
                      <div className="small text-muted">Confirms all detected items.</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="outline-secondary" size="sm" onClick={() => setPendingOrder(null)} disabled={loading}>
                        Not now
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Adding…' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Form onSubmit={handleSend} className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder="e.g. Order 2 zinger burgers and 1 coke"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderChatBot;
