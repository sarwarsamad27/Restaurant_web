import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h5 className="gradient-text mb-3">🌮 TastyTrails</h5>
            <p className="text-muted">
              Follow the trail to your next meal. Curated eateries, crafted experiences, delivered to you.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light"><FaFacebook size={24} /></a>
              <a href="#" className="text-light"><FaTwitter size={24} /></a>
              <a href="#" className="text-light"><FaInstagram size={24} /></a>
              <a href="#" className="text-light"><FaLinkedin size={24} /></a>
            </div>
          </Col>
          <Col md={4} className="mb-3">
            <h6 className="mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li><Link to="/" className="text-muted text-decoration-none">Home</Link></li>
              <li><Link to="/restaurants" className="text-muted text-decoration-none">Restaurants</Link></li>
              <li><Link to="/about" className="text-muted text-decoration-none">About Us</Link></li>
              <li><Link to="/contact" className="text-muted text-decoration-none">Contact</Link></li>
            </ul>
          </Col>
          <Col md={4} className="mb-3">
            <h6 className="mb-3">Contact Info</h6>
            <ul className="list-unstyled text-muted">
              <li>📍 123 Food Street, City, Country</li>
              <li>📞 +1 234 567 890</li>
              <li>✉️ hello@tastytrails.com</li>
              <li>🕒 24/7 Support</li>
            </ul>
          </Col>
        </Row>
        <hr className="bg-secondary" />
        <Row>
          <Col className="text-center text-muted">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} Restaurant Food Delivery System. 
              All rights reserved. | Final Year Project
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
