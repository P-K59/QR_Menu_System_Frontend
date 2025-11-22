import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './Order.css';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    // Connect WebSocket for real-time updates
    const socket = io('http://localhost:5000');
    socket.emit('join', userId);
    
    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => 
        prev.map(order => order._id === updatedOrder._id ? updatedOrder : order)
      );
    });

    fetchOrders();

    return () => socket.disconnect();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const restaurantId = localStorage.getItem('userId');
      const response = await axios.get(`http://localhost:5000/api/orders?restaurantId=${restaurantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}`, {
        status: newStatus
      });
      setOrders(orders.map(order => 
        order._id === orderId ? response.data : order
      ));
    } catch (error) {
      alert('Error updating order: ' + error.response?.data?.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FF9800';
      case 'process': return '#2196F3';
      case 'complete': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'fas fa-hourglass-half';
      case 'process': return 'fas fa-spinner';
      case 'complete': return 'fas fa-check-circle';
      case 'cancelled': return 'fas fa-ban';
      default: return 'fas fa-question';
    }
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    process: orders.filter(o => o.status === 'process').length,
    complete: orders.filter(o => o.status === 'complete').length
  };

  if (loading) {
    return (
      <div className="orders-page-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      <div className="orders-header">
        <h1><i className="fas fa-clipboard-list"></i> Order Management</h1>
        <button onClick={fetchOrders} className="refresh-btn">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button 
          className={`status-tab ${selectedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('all')}
        >
          <span className="tab-label">All Orders</span>
          <span className="tab-count">{statusCounts.all}</span>
        </button>
        <button 
          className={`status-tab ${selectedFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('pending')}
          style={{ borderLeftColor: '#FF9800' }}
        >
          <span className="tab-label"><i className="fas fa-hourglass-half"></i> Pending</span>
          <span className="tab-count">{statusCounts.pending}</span>
        </button>
        <button 
          className={`status-tab ${selectedFilter === 'process' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('process')}
          style={{ borderLeftColor: '#2196F3' }}
        >
          <span className="tab-label"><i className="fas fa-spinner"></i> Processing</span>
          <span className="tab-count">{statusCounts.process}</span>
        </button>
        <button 
          className={`status-tab ${selectedFilter === 'complete' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('complete')}
          style={{ borderLeftColor: '#4CAF50' }}
        >
          <span className="tab-label"><i className="fas fa-check-circle"></i> Completed</span>
          <span className="tab-count">{statusCounts.complete}</span>
        </button>
      </div>

      {/* Orders Grid */}
      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <i className="fas fa-inbox"></i>
            <p>No {selectedFilter !== 'all' ? selectedFilter : ''} orders</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-number">
                  <span className="label">Order</span>
                  <span className="number">#{order._id.slice(-4).toUpperCase()}</span>
                </div>
                <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                  <i className={getStatusIcon(order.status)}></i>
                  <span>{order.status.toUpperCase()}</span>
                </div>
              </div>

              <div className="order-card-content">
                <div className="order-info">
                  <div className="info-item">
                    <i className="fas fa-user"></i>
                    <div>
                      <span className="label">Customer</span>
                      <span className="value">{order.customerName || 'Guest'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-chair"></i>
                    <div>
                      <span className="label">Table</span>
                      <span className="value">{order.tableNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <div>
                      <span className="label">Time</span>
                      <span className="value">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="item-name">{item.menuItemName}</span>
                        <span className="item-qty">x{item.quantity}</span>
                        <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="order-card-footer">
                <div className="status-buttons">
                  {order.status !== 'pending' && (
                    <button 
                      className="status-btn pending-btn"
                      onClick={() => updateOrderStatus(order._id, 'pending')}
                      title="Mark as Pending"
                    >
                      <i className="fas fa-hourglass-half"></i>
                    </button>
                  )}
                  {order.status !== 'process' && (
                    <button 
                      className="status-btn process-btn"
                      onClick={() => updateOrderStatus(order._id, 'process')}
                      title="Mark as Processing"
                    >
                      <i className="fas fa-spinner"></i>
                    </button>
                  )}
                  {order.status !== 'complete' && (
                    <button 
                      className="status-btn complete-btn"
                      onClick={() => updateOrderStatus(order._id, 'complete')}
                      title="Mark as Complete"
                    >
                      <i className="fas fa-check-circle"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Order;
