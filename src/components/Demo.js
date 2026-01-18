import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import API_BASE_URL from '../config'
import './Demo.css';

const Demo = () => {
  const [view, setView] = useState('owner'); // 'owner' or 'customer'
  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Margherita Pizza',
      price: 299,
      description: 'Fresh tomatoes, mozzarella, and basil',
      image: 'https://media.istockphoto.com/id/1168754685/photo/pizza-margarita-with-cheese-top-view-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=psLRwd-hX9R-S_iYU-sihB4Jx2aUlUr26fkVrxGDfNg=',
      category: 'Pizza'
    }
  ]);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: ''
  });
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(1);
  const [totalTables, setTotalTables] = useState(4);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [customerTableNumber, setCustomerTableNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    tableNumber: ''
  });
  const [restaurantIdForDemo, setRestaurantIdForDemo] = useState('');
  const [restaurantIdFromQr, setRestaurantIdFromQr] = useState('');

  // Initialize view/table from query params so QR links work (e.g. /demo?view=customer&table=2)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const tableParam = params.get('table');
      const restParam = params.get('restaurantId');
      if (viewParam === 'customer') setView('customer');
      if (tableParam) setCustomerInfo(prev => ({ ...prev, tableNumber: tableParam }));
      if (restParam) setRestaurantIdFromQr(restParam);
    } catch (err) {
      // ignore
    }
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    setMenuItems([...menuItems, { ...newItem, id: Date.now() }]);
    setNewItem({ name: '', price: '', description: '', category: '', image: '' });
  };

  const handleAddToCart = (item) => {
    setCart([...cart, item]);
  };

  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);
  };

  const placeOrder = async () => {
    if (!customerInfo.name || !customerInfo.tableNumber) {
      alert('Please enter your name and table number');
      return;
    }

    // Build items array with quantities
    const itemsMap = {};
    cart.forEach((item) => {
      const key = item.id || item._id || item.name;
      if (!itemsMap[key]) {
        itemsMap[key] = { name: item.name, price: parseFloat(item.price) || 0, quantity: 0 };
      }
      itemsMap[key].quantity += 1;
    });

    const items = Object.values(itemsMap).map(i => ({ menuItemName: i.name, price: i.price, quantity: i.quantity }));

    const payload = {
      items,
      tableNumber: parseInt(customerInfo.tableNumber, 10),
      customerName: customerInfo.name,
      totalAmount: parseFloat(getTotal())
    };
    // attach restaurantId when available (from QR or demo config)
    const restIdToUse = restaurantIdFromQr || restaurantIdForDemo;
    if (restIdToUse) {
      payload.restaurantId = restIdToUse;
    }

    try {
      const res = await axios.post('${API_BASE_URL}/api/orders', payload);
      if (res.status === 201) {
        alert(`Order placed!\nCustomer: ${customerInfo.name}\nTable: ${customerInfo.tableNumber}\nTotal: ₹${getTotal()}`);
        setCart([]);
        setCustomerInfo({ name: '', tableNumber: '' });
      } else {
        alert('Order failed. Please try again.');
      }
    } catch (err) {
      console.error('Order error:', err);
      alert('Error placing order. Please try again.');
    }
  }

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1>QR Menu Demo</h1>
        <div className="view-toggle">
          <button 
            className={view === 'owner' ? 'active' : ''} 
            onClick={() => setView('owner')}
          >
            Restaurant View
          </button>
          <button 
            className={view === 'customer' ? 'active' : ''} 
            onClick={() => setView('customer')}
          >
            Customer View
          </button>
        </div>
      </div>

      {view === 'owner' ? (
        <div className="owner-view">
          <div className="menu-management">
            <h2>Menu Management</h2>
            <form onSubmit={handleAddItem} className="add-item-form">
              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  placeholder="e.g., Chicken Burger"
                />
              </div>
              <div className="form-group">
                <label>Price (₹):</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  required
                  step="0.01"
                  placeholder="e.g., 9.99"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Enter item description"
                />
              </div>
              <div className="form-group">
                <label>Category:</label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="e.g., Main Course"
                />
              </div>
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <button type="submit" className="add-button">Add Menu Item</button>
            </form>
          </div>

          <div className="menu-preview">
            <h2>Current Menu</h2>
            <div className="menu-actions">
              <button 
                className="action-button generate-qr"
                onClick={() => setQrGenerated(true)}
                disabled={menuItems.length === 0}
              >
                Generate QR Code
              </button>
              <button 
                className="action-button update-menu"
                onClick={() => {
                  setQrGenerated(true);
                  alert('Menu updated successfully!');
                }}
                disabled={menuItems.length === 0}
              >
                Update Menu
              </button>
            </div>
            <div className="menu-items-grid">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-item-card">
                  <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <p className="price">₹{parseFloat(item.price).toFixed(2)}</p>
                  <p className="category">{item.category}</p>
                  <button 
                    className="delete-item"
                    onClick={() => {
                      setMenuItems(menuItems.filter(menuItem => menuItem.id !== item.id));
                      setQrGenerated(false);
                    }}
                  >
                    Delete Item
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="qr-section">
            <h2>Restaurant Configuration</h2>
            <div className="table-config">
              <label>Total Number of Tables:</label>
              <input
                type="number"
                min="1"
                value={totalTables}
                onChange={(e) => {
                  setTotalTables(parseInt(e.target.value) || 1);
                  setQrGenerated(false);
                }}
              />
            </div>
            <div className="table-config">
              <label>Restaurant ID (for demo QR):</label>
              <input
                type="text"
                placeholder="paste restaurant userId here"
                value={restaurantIdForDemo}
                onChange={(e) => setRestaurantIdForDemo(e.target.value)}
              />
            </div>
            {qrGenerated && menuItems.length > 0 && (
              <div className="qr-grid">
                <div className="qr-card">
                  <h3>Restaurant Menu QR</h3>
                  <QRCode 
                    value={`${window.location.origin}/demo?view=customer${restaurantIdForDemo ? `&restaurantId=${encodeURIComponent(restaurantIdForDemo)}` : ''}`}
                    size={150}
                  />
                  <p>Scan to view menu</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="customer-view">
          <div className="customer-header">
            <h2>Restaurant Menu</h2>
            <div className="customer-info">
              <div className="info-input">
                <label>Your Name:</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div className="info-input">
                <label>Table Number (1-{totalTables}):</label>
                <input
                  type="number"
                  min="1"
                  max={totalTables}
                  value={customerInfo.tableNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                  required
                  placeholder="Enter table number"
                />
              </div>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-items-grid">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-item-card">
                  <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <p className="price">₹{parseFloat(item.price).toFixed(2)}</p>
                  <button 
                    className="add-to-cart"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>

          {cart.length > 0 && (
            <div className="cart-section">
              <h3>Your Cart</h3>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <img src={item.image || 'https://via.placeholder.com/50'} alt={item.name} />
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>₹{parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <button 
                      className="remove-item"
                      onClick={() => handleRemoveFromCart(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <h4>Total: ₹{getTotal()}</h4>
                <button className="place-order-btn" onClick={placeOrder}>
                  Place Order
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Demo;
