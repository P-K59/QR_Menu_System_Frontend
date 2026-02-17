import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Get token and email from URL params or navigation state
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (token && email) {
      setFormData(prev => ({
        ...prev,
        token,
        email
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email) {
      setError('Email is required');
      return;
    }

    if (!formData.token) {
      setError('Reset code is required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/users/reset-password`, {
        email: formData.email,
        token: formData.token,
        newPassword: formData.newPassword
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Reset Password</h2>
        <p>Enter your reset code and new password</p>
      </div>

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <i className="fas fa-envelope"></i>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="token">Reset Code</label>
          <i className="fas fa-key"></i>
          <input
            type="text"
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="Enter the 6-digit code from your email"
            disabled={loading}
            required
            maxLength="6"
            style={{ textTransform: 'uppercase' }}
          />
          <small>Check your email for the reset code (valid for 30 minutes)</small>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <i className="fas fa-lock"></i>
          <input
            type={showPassword ? 'text' : 'password'}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <i className="fas fa-lock"></i>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="showPassword">Show passwords</label>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="auth-footer">
        Remember your password? <Link to="/login">Login here</Link>
      </div>
    </div>
  );
};

export default ResetPassword;
