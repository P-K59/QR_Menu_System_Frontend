import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';
import './Dashboard.css';

const Dashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // Connect to WebSocket
    const socket = io('http://localhost:5000');
    socket.emit('join', userId);
    
    socket.on('newOrder', (order) => {
      setOrders(prev => [order, ...prev]);
      // Play notification sound
      new Audio('/notification.mp3').play();
    });

    // Fetch menu items and orders
    const fetchData = async () => {
      try {
        const [menuRes, ordersRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/menu/${userId}`),
          axios.get(`http://localhost:5000/api/orders/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setMenuItems(menuRes.data);
        setOrders(ordersRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => socket.disconnect();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/menu', newItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems([...menuItems, response.data]);
      setNewItem({ name: '', description: '', price: '', category: '', image: '' });
    } catch (error) {
      alert('Error adding menu item: ' + error.response?.data?.message);
    }
  };

  const handleUpdateItem = async (id, updatedItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/menu/${id}`, updatedItem, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(menuItems.map(item => 
        item._id === id ? response.data : item
      ));
    } catch (error) {
      alert('Error updating menu item: ' + error.response?.data?.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="qr-section">
        <h2>Restaurant Menu</h2>
        <div className="share-links">
          <div className="share-link">
            <h3>Shareable Menu Link</h3>
            <div className="link-container">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/menu/${localStorage.getItem('userId')}`}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/menu/${localStorage.getItem('userId')}`);
                  alert('Link copied to clipboard!');
                }}
                className="copy-button"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="table-qr-codes">
          <h3>Table QR Codes</h3>
          <div className="qr-grid">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(tableNum => (
              <div key={tableNum} className="qr-card">
                <h4>Table {tableNum}</h4>
                <QRCode 
                  value={`${window.location.origin}/menu/${localStorage.getItem('userId')}?table=${tableNum}`} 
                  size={150}
                />
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/menu/${localStorage.getItem('userId')}?table=${tableNum}`;
                    navigator.clipboard.writeText(link);
                    alert(`Table ${tableNum} link copied to clipboard!`);
                  }}
                  className="copy-button"
                >
                  Copy Link <i className="fas fa-copy"></i>
                </button>
                <a 
                  href={`${window.location.origin}/menu/${localStorage.getItem('userId')}?table=${tableNum}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-button"
                >
                  Preview <i className="fas fa-external-link-alt"></i>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="menu-section">
        <h2>Manage Menu</h2>
        <form onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL"
            value={newItem.image}
            onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
          />
          <button type="submit" className="button">Add Item</button>
        </form>

        <div className="menu-items">
          {menuItems.map(item => (
            <div key={item._id} className="menu-item-card">
              <img src={item.image || 'placeholder.jpg'} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>${item.price}</p>
              <button onClick={() => handleUpdateItem(item._id, {
                ...item,
                available: !item.available
              })}>
                {item.available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="orders-section">
        <h2>Recent Orders</h2>
        {orders.map(order => (
          <div key={order._id} className="order-card">
            <h3>Order #{order._id.slice(-4)}</h3>
            <p>Table: {order.tableNumber}</p>
            <p>Status: {order.status}</p>
            <p>Total: ${order.totalAmount}</p>
            <div className="order-items">
              {order.items.map((item, index) => (
                <div key={index}>
                  {item.menuItem.name} x {item.quantity}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;