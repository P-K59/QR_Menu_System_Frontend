import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    tables: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.email || !formData.password || !formData.restaurantName || !formData.tables) {
        setError('All fields are required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const tablesArray = formData.tables
        .split(',')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));

      const requestData = {
        email: formData.email.trim(),
        password: formData.password,
        restaurantName: formData.restaurantName.trim(),
        tables: tablesArray
      };

      const response = await axios.post(`${API_BASE_URL}/api/users/register`, requestData);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        navigate('/dashboard');
      } else if (response.data) {
        navigate('/login', {
          state: { message: 'Registration successful! Please login.' }
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Register Restaurant</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Restaurant Name:</label>
          <input
            type="text"
            value={formData.restaurantName}
            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Table Numbers (comma-separated, e.g., 1, 2, 3):</label>
          <input
            type="text"
            placeholder="1, 2, 3, 4..."
            value={formData.tables}
            onChange={(e) => setFormData({ ...formData, tables: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="button">Register</button>
      </form>
    </div>
  );
};

export default Register;