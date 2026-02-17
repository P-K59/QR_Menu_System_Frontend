import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';
import API_BASE_URL from '../config';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu, settings
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentItem, setCurrentItem] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('soundEnabled') !== 'false';
  });
  const [restaurantData, setRestaurantData] = useState(null);
  const [tableInput, setTableInput] = useState('');
  const [printOrder, setPrintOrder] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });

  // Fetch initial data
  useEffect(() => {
    const userId = localStorage.getItem('userId');

    // Socket Setup
    const socket = io(`${API_BASE_URL}`);
    socket.emit('join', userId);

    socket.on('newOrder', (order) => {
      addNotification(`🎉 New Order! Table ${order.tableNumber}`, 'success');
      setOrders(prev => [order, ...prev]);
      if (soundEnabled) playNotificationSound();
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        const [menuRes, ordersRes, userRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/menu/${userId}`),
          axios.get(`${API_BASE_URL}/api/orders`, { headers }),
          axios.get(`${API_BASE_URL}/api/users/${userId}`, { headers })
        ]);
        setMenuItems(menuRes.data);
        setOrders(ordersRes.data);
        setRestaurantData(userRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    return () => socket.disconnect();
  }, [soundEnabled]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => { });
  };

  // Menu Actions
  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image
      });
    } else {
      setFormData({ name: '', description: '', price: '', category: '', image: '' });
    }
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const userId = localStorage.getItem('userId');

    try {
      if (modalMode === 'add') {
        const res = await axios.post(`${API_BASE_URL}/api/menu`, { ...formData, owner: userId }, { headers });
        setMenuItems([...menuItems, res.data]);
        addNotification('Item added successfully!');
      } else {
        const res = await axios.put(`${API_BASE_URL}/api/menu/${currentItem._id}`, formData, { headers });
        setMenuItems(menuItems.map(i => i._id === currentItem._id ? res.data : i));
        addNotification('Item updated successfully!');
      }
      setShowModal(false);
    } catch (error) {
      addNotification(error.response?.data?.message || 'Error saving item', 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const res = await axios.put(`${API_BASE_URL}/api/menu/${item._id}`,
        { available: !item.available },
        { headers }
      );
      setMenuItems(menuItems.map(i => i._id === item._id ? res.data : i));
      addNotification(`Item marked as ${!item.available ? 'Available' : 'Unavailable'}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      await axios.delete(`${API_BASE_URL}/api/menu/${id}`, { headers });
      setMenuItems(menuItems.filter(i => i._id !== id));
      addNotification('Item deleted');
    } catch (error) {
      console.error(error);
    }
  };

  // Order Actions
  const updateOrderStatus = async (orderId, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const res = await axios.put(`${API_BASE_URL}/api/orders/${orderId}`, { status }, { headers });

      setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? res.data : o));

      if (status === 'complete' || status === 'cancelled') {
        addNotification(`Order ${status === 'complete' ? 'Completed' : 'Cancelled'}`, 'success');
      }
    } catch (error) {
      console.error('Error updating order status:', error.response?.data || error.message);
      addNotification(`Error: ${error.response?.data?.message || 'Update failed'}`, 'error');
    }
  };

  const handlePrintBill = (order) => {
    setPrintOrder(order);

    // Give state time to render the printable-bill-template before printing
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 200);

    // Trigger billed status update
    if (order.status !== 'billed' && order.status !== 'complete') {
      updateOrderStatus(order._id, 'billed');
    }
  };

  // Restaurant Actions
  const handleUpdateTables = async (newTables) => {
    try {
      const userId = localStorage.getItem('userId');
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const res = await axios.put(`${API_BASE_URL}/api/users/${userId}`, {
        restaurantName: restaurantData.restaurantName,
        tables: newTables
      }, { headers });
      setRestaurantData(res.data);
      addNotification('Tables updated successfully', 'success');
    } catch (error) {
      console.error(error);
      addNotification('Error updating tables', 'error');
    }
  };

  const addTable = () => {
    const num = parseInt(tableInput);
    if (!num || isNaN(num)) return;
    if (restaurantData.tables.includes(num)) {
      addNotification('Table already exists', 'error');
      return;
    }
    const newTables = [...restaurantData.tables, num].sort((a, b) => a - b);
    handleUpdateTables(newTables);
    setTableInput('');
  };

  const removeTable = (num) => {
    const newTables = restaurantData.tables.filter(t => t !== num);
    handleUpdateTables(newTables);
  };
  const downloadQRCode = () => {
    const svg = document.querySelector('.settings-qr-container svg');
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
      link.download = 'restaurant-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  };

  // Render Functions
  const renderOrders = () => {
    // Only show orders that are NOT complete or cancelled in the live board
    const liveOrders = orders.filter(o => o.status !== 'complete' && o.status !== 'cancelled');

    const columns = {
      pending: liveOrders.filter(o => o.status === 'pending'),
      process: liveOrders.filter(o => o.status === 'process'),
      ready: liveOrders.filter(o => o.status === 'ready' || o.status === 'billed')
    };

    return (
      <div className="kanban-board">
        {/* Pending Column */}
        <div className="kanban-column status-pending">
          <h3>🕒 Pending <span className="count">{columns.pending.length}</span></h3>
          {columns.pending.map(order => (
            <OrderCard key={order._id} order={order}
              onNext={() => updateOrderStatus(order._id, 'process')}
              onCancel={() => updateOrderStatus(order._id, 'cancelled')}
            />
          ))}
        </div>

        {/* Processing Column */}
        <div className="kanban-column status-process">
          <h3>🔥 Preparing <span className="count">{columns.process.length}</span></h3>
          {columns.process.map(order => (
            <OrderCard key={order._id} order={order}
              onPrev={() => updateOrderStatus(order._id, 'pending')}
              onNext={() => updateOrderStatus(order._id, 'ready')}
              onPrint={() => handlePrintBill(order)}
            />
          ))}
        </div>

        {/* Completed/Ready Column */}
        <div className="kanban-column status-complete">
          <h3>✅ Ready <span className="count">{columns.ready.length}</span></h3>
          {columns.ready.map(order => (
            <OrderCard key={order._id} order={order}
              onPrev={() => updateOrderStatus(order._id, 'process')}
              onNext={() => updateOrderStatus(order._id, 'complete')}
              onPrint={() => handlePrintBill(order)}
              isReady
            />
          ))}
        </div>
      </div>
    );
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenuItems = menuItems.filter(item =>
    (item.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderMenu = () => (
    <div>
      <div className="menu-toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search menu..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={() => handleOpenModal('add')}>
          <span className="btn-icon">+</span> Add Item
        </button>
      </div>

      <div className="menu-grid">
        {filteredMenuItems.map(item => (
          <div key={item._id} className="menu-card">
            <div className={`availability-badge ${item.available ? 'available' : 'unavailable'}`}>
              {item.available ? 'In Stock' : 'Sold Out'}
            </div>
            <div className="menu-img-container">
              <img src={item.image || 'https://via.placeholder.com/300'} alt={item.name} />
            </div>
            <div className="menu-content">
              <div className="menu-header">
                <span className="menu-title">{item.name}</span>
                <span className="menu-price">₹{item.price}</span>
              </div>
              <p className="menu-desc">{item.description}</p>
              <div className="menu-actions">
                <button className="menu-btn btn-edit" onClick={() => handleOpenModal('edit', item)}>Edit</button>
                <button className="menu-btn btn-toggle" onClick={() => toggleAvailability(item)}>
                  {item.available ? 'Sold Out' : 'Restock'}
                </button>
                <button className="menu-btn btn-delete" onClick={() => handleDeleteItem(item._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {filteredMenuItems.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>No menu items found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-container">
      {/* 1. QR Code Center */}
      <div className="settings-card qr-section">
        <div className="card-header-main">
          <h2>📱 QR Code Center</h2>
          <p>Scan to view your digital menu</p>
        </div>
        <div className="qr-preview-wrapper">
          <div className="settings-qr-container">
            <QRCode value={`${window.location.origin}/menu/${localStorage.getItem('userId')}`} size={180} />
          </div>
          <div className="qr-actions-grid">
            <a className="qr-action-tile" href={`/menu/${localStorage.getItem('userId')}`} target="_blank" rel="noreferrer">
              <span className="tile-icon">🌐</span>
              <span className="tile-text">Live Menu</span>
            </a>
            <button className="qr-action-tile" onClick={downloadQRCode}>
              <span className="tile-icon">📥</span>
              <span className="tile-text">Download</span>
            </button>
            <button className="qr-action-tile" onClick={() => window.print()}>
              <span className="tile-icon">🖨️</span>
              <span className="tile-text">Print All</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Table Management */}
      <div className="settings-card table-section">
        <div className="card-header-main">
          <h2>🪑 Table Management</h2>
          <p>Configure your restaurant layout</p>
        </div>
        <div className="table-manager-content">
          <div className="table-add-group">
            <input
              type="number"
              placeholder="Table No."
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTable()}
            />
            <button className="add-table-btn" onClick={addTable}>Add</button>
          </div>
          <div className="tables-list">
            {restaurantData?.tables.map(num => (
              <div key={num} className="table-chip">
                <span>Table {num}</span>
                <div className="table-actions-inline">
                  <a href={`${window.location.origin}/menu/${localStorage.getItem('userId')}?table=${num}`} target="_blank" rel="noreferrer" title="Open table menu">🔗</a>
                  <button className="remove-table" onClick={() => removeTable(num)}>&times;</button>
                </div>
              </div>
            ))}
            {(!restaurantData?.tables || restaurantData.tables.length === 0) && (
              <div className="empty-state">No tables added yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. System Preferences */}
      <div className="settings-card pref-section">
        <div className="card-header-main">
          <h2>🛠️ System Preferences</h2>
        </div>
        <div className="pref-item">
          <div className="pref-info">
            <span className="pref-title">🔔 Order Sound Alerts</span>
            <span className="pref-desc">Play sound when new orders arrive</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => {
                setSoundEnabled(e.target.checked);
                localStorage.setItem('soundEnabled', e.target.checked);
              }}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="restaurant-info-footer">
          <div className="info-row">
            <span className="info-label">Restaurant ID:</span>
            <span className="info-val">{restaurantData?._id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Restaurant Name:</span>
            <span className="info-val">{restaurantData?.restaurantName}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Notifications */}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification notification-${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <h1>Restaurant Dashboard</h1>
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Live Orders
          </button>
          <button
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍔 Menu Manager
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? '✨ Add New Item' : '✏️ Edit Item'}</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column: textual inputs */}
                <div>
                  <div className="input-group">
                    <input
                      type="text"
                      className="interactive-input"
                      placeholder=" "
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <label>Item Name</label>
                  </div>

                  <div className="input-group">
                    <textarea
                      className="interactive-input"
                      placeholder=" "
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      style={{ height: '120px', resize: 'none' }}
                    />
                    <label>Description</label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group">
                      <input
                        type="number"
                        className="interactive-input"
                        placeholder=" "
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                      <label>Price (₹)</label>
                    </div>
                    <div className="input-group">
                      <select
                        className="interactive-input"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        required
                        style={{ appearance: 'none' }}
                      >
                        <option value="" disabled hidden></option>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                      <label>Category</label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Image inputs */}
                <div>
                  <div className="input-group">
                    <input
                      type="text"
                      className="interactive-input"
                      placeholder=" "
                      value={formData.image}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                    />
                    <label>Paste Image URL</label>
                  </div>

                  <div className="file-input-wrapper">
                    <label>Or Upload Image</label>
                    <input type="file" className="file-input" onChange={handleImageUpload} accept="image/*" />
                  </div>

                  {formData.image && (
                    <div className="img-preview">
                      <img src={formData.image} alt="Preview" onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Invalid+URL'} />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DEDICATED PRINTABLE BILL TEMPLATE (Hidden by default) */}
      {printOrder && (
        <div className="printable-bill-template">
          <div className="bill-header">
            <h1>{restaurantData?.restaurantName || 'RESTAURANT'}</h1>
            <p className="bill-subtitle">Admin Copy - Bill Receipt</p>
            <div className="bill-divider"></div>
          </div>

          <div className="bill-info">
            <p><span>Order ID:</span> <span>#{printOrder._id.slice(-6).toUpperCase()}</span></p>
            <p><span>Date:</span> <span>{new Date(printOrder.createdAt).toLocaleString()}</span></p>
            <p><span>Customer:</span> <span>{printOrder.customerName || 'Guest'}</span></p>
            <p><span>Table No:</span> <span>{printOrder.tableNumber}</span></p>
          </div>

          <div className="bill-divider"></div>

          <table className="bill-table">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {printOrder.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-left">{item.menuItemName}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bill-divider"></div>

          <div className="bill-total-row">
            <span>Total Amount</span>
            <span>₹{printOrder.totalAmount?.toFixed(2)}</span>
          </div>

          <div className="bill-footer">
            <p>Restaurant Copy</p>
            <p>Generated by QR Menu Pro</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component for Order Card
const OrderCard = ({ order, onNext, onPrev, onCancel, onPrint, isReady, isCompleted }) => (
  <div className={`kanban-card ${isReady ? 'ready-card' : ''}`}>
    <div className="card-header">
      <div className="header-top">
        <span className="table-badge">T-{order.tableNumber}</span>
        <span className="time-badge">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="customer-info-compact">
        <span className="customer-name-small">{order.customerName || 'Guest'}</span>
      </div>
    </div>
    <div className="card-items-compact">
      {order.items.map((item, i) => (
        <div key={i} className="card-item-compact">
          <span className="item-qty-compact">{item.quantity}x</span>
          <span className="item-name-compact">{item.menuItemName}</span>
        </div>
      ))}
    </div>
    <div className="card-footer-compact">
      <div className="total-section-compact">
        <span className="total-price-compact">₹{order.totalAmount}</span>
        {order.status === 'billed' && <span className="billed-indicator">Billed</span>}
      </div>
      {!isCompleted && (
        <div className="card-actions-compact">
          {onCancel && <button className="compact-action-btn btn-cancel" onClick={onCancel} title="Cancel">✕</button>}
          {onPrev && <button className="compact-action-btn btn-prev" onClick={onPrev} title="Back">←</button>}
          {onPrint && <button className={`compact-action-btn ${order.status === 'billed' ? 'btn-billed' : 'btn-print'}`} onClick={onPrint} title="Print Bill">🖨️</button>}
          {onNext && (
            <button className="compact-action-btn btn-next" onClick={onNext} title={isReady ? "Complete" : "Next"}>
              {isReady ? '✓' : '➜'}
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default Dashboard;
