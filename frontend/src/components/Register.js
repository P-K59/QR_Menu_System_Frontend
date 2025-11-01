import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    tables: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Client-side validation
      if (!formData.email || !formData.password || !formData.restaurantName || !formData.tables) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Password validation
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      // Format the data
      const requestData = {
        email: formData.email.trim(),
        password: formData.password,
        restaurantName: formData.restaurantName.trim(),
        tables: formData.tables.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num))
      };

      console.log('Sending registration data:', requestData);

      const response = await axios.post('http://localhost:5000/api/users/register', requestData);
      
      console.log('Registration response:', response.data);

      if (response.data) {
        // Clear form and navigate to login
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          restaurantName: '',
          tables: ''
        });
        navigate('/login', { 
          state: { message: 'Registration successful! Please login.' }
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const tables = e.target.value.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    setFormData({ ...formData, tables });
  };

  return (
    <div className="auth-container">
      <h2>Register Restaurant</h2>
      <form onSubmit={handleSubmit}>
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
          <label>Table Numbers (comma-separated):</label>
          <input
            type="text"
            placeholder="1, 2, 3, 4..."
            onChange={handleTableChange}
            required
          />
        </div>
        <button type="submit" className="button">Register</button>
      </form>
    </div>
  );
};

export default Register;