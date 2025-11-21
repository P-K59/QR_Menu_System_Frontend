import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';
import './Dashboard.css';

const Dashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    
    // Connect to WebSocket
    const socket = io('http://localhost:5000');
    socket.emit('join', userId);
    
    socket.on('newOrder', (order) => {
      // Play notification sound
      try { new Audio('/notification.mp3').play(); } catch(e) { /* ignore */ }
    });

    // Fetch menu items and restaurant info
    const fetchData = async () => {
      try {
        const menuRes = await axios.get(`http://localhost:5000/api/menu/${userId}`);
        setMenuItems(menuRes.data);
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
      const userId = localStorage.getItem('userId');
      const response = await axios.post('http://localhost:5000/api/menu', { ...newItem, owner: userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems([...menuItems, response.data]);
      setNewItem({ name: '', description: '', price: '', category: '', image: '' });
    } catch (error) {
      alert('Error adding menu item: ' + error.response?.data?.message);
    }
  };

  // Download QR code as PNG
  const downloadQRCode = (qrElement, filename) => {
    try {
      const svg = qrElement.querySelector('svg');
      if (!svg) {
        alert('QR code not found');
        return;
      }
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        const png = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = png;
        link.download = filename || 'qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.onerror = () => alert('Failed to render QR code');
      img.src = url;
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download QR code');
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

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (error) {
      alert('Error deleting menu item: ' + error.response?.data?.message);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id);
    setEditFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name || !editFormData.price) {
      alert('Name and price are required');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/menu/${editingItemId}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(menuItems.map(item => 
        item._id === editingItemId ? response.data : item
      ));
      setEditingItemId(null);
    } catch (error) {
      alert('Error updating menu item: ' + error.response?.data?.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="qr-section">
        <h2>📱 Your Unique Restaurant QR Codes</h2>
        <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>✓ Each restaurant has a unique QR code</strong></p>
          <p>Your Restaurant ID (Unique): <code style={{ backgroundColor: '#fff', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold' }}>{localStorage.getItem('userId')}</code></p>
          <p>Customers scanning your QR will ONLY see your menu and can place orders.</p>
        </div>
        
        <div className="share-links">
          <div className="share-link">
            <h3>Main Menu QR Code</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Customers scan this to view your menu and place orders</p>
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
            <div style={{ marginTop: '15px' }}>
              <h4>Download QR Code</h4>
              <div id="qr-container" style={{ padding: '10px', backgroundColor: '#fff', display: 'inline-block', borderRadius: '8px' }}>
                <QRCode value={`${window.location.origin}/menu/${localStorage.getItem('userId')}`} size={200} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => downloadQRCode(document.getElementById('qr-container'), 'restaurant-qr.png')}
                  className="button"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  Download QR Code
                </button>
              </div>
            </div>
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
            <div key={item._id}>
              {editingItemId === item._id ? (
                <div className="edit-form" style={{ border: '2px solid #007bff', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                  <h3>Edit Menu Item</h3>
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                  />
                  <textarea
                    placeholder="Description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '60px' }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                  />
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                  >
                    <option value="">Select Category</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={editFormData.image}
                    onChange={(e) => setEditFormData({...editFormData, image: e.target.value})}
                    style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingItemId(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="menu-item-card">
                  <img src={item.image || 'placeholder.jpg'} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1em' }}>₹{item.price}</p>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleUpdateItem(item._id, {
                      ...item,
                      available: !item.available
                    })} style={{ flex: 1, padding: '8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {item.available ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button onClick={() => handleEditItem(item)} style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️ Edit</button>
                    <button onClick={() => handleDeleteItem(item._id)} style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;