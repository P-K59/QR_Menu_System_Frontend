import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Don't show header on customer menu pages
  const isCustomerPage = location.pathname.startsWith('/menu/');
  if (isCustomerPage) {
    return null;
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <i className="fas fa-qrcode"></i>
          QR Menu
        </Link>
        
        <button 
          className={`menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
              <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>
                <i className="fas fa-clipboard-list"></i> Orders
              </Link>
              <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
                <i className="fas fa-user-circle"></i> Profile
              </Link>
              <div className="user-profile">
                <button onClick={handleLogout} className="button button-secondary">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
              <Link to="/register" className="button">
                <i className="fas fa-user-plus"></i> Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;