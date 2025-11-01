import React from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Smart QR Menu System</h1>
          <p>Transform your restaurant with digital menus and contactless ordering</p>
          <div className="hero-buttons">
            <Link to="/register" className="button">Get Started</Link>
            <Link to="/demo" className="button button-secondary">View Demo</Link>
          </div>
        </div>
        <div className="hero-image">
          <QRCode value="https://demo-menu.com" size={200} />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Digital Menu</h3>
            <p>Easy to update menu with prices and images</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Real-time Updates</h3>
            <p>Instantly update menu items and availability</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3>Order Management</h3>
            <p>Track and manage orders efficiently</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Get insights about your menu performance</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Register Restaurant</h3>
            <p>Create an account for your restaurant</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Add Menu Items</h3>
            <p>Upload your menu with images and prices</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get QR Code</h3>
            <p>Place QR codes on your tables</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Receive Orders</h3>
            <p>Get instant notifications for new orders</p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section">
        <div className="demo-content">
          <h2>Try Demo Menu</h2>
          <p>Scan the QR code or click below to view a sample menu</p>
          <div className="demo-qr">
            <QRCode value="https://demo-menu.com" size={150} />
          </div>
          <Link to="/demo" className="button">View Demo Menu</Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to Digitize Your Menu?</h2>
        <p>Join hundreds of restaurants already using our system</p>
        <div className="cta-buttons">
          <Link to="/register" className="button">Get Started Now</Link>
          <Link to="/contact" className="button button-secondary">Contact Sales</Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;