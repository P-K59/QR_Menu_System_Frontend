import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import OrderSuccessModal from './OrderSuccessModal';
import API_BASE_URL from '../config';
import './Menu.css';

const Menu = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartSheet, setShowCartSheet] = useState(false);

  // Setup WebSocket listener for menu updates
  useEffect(() => {
    const socket = io(`${API_BASE_URL}`);
    socket.emit('join', userId);

    socket.on('menuUpdated', (updatedItem) => {
      setMenuItems(prevItems =>
        prevItems.map(item => item._id === updatedItem._id ? updatedItem : item)
      );
    });

    return () => socket.disconnect();
  }, [userId]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuResponse, restaurantResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/menu/${userId}`),
        axios.get(`${API_BASE_URL}/api/users/${userId}/public`)
      ]);

      setMenuItems(menuResponse.data);
      setRestaurantInfo(restaurantResponse.data);

      const uniqueCategories = [...new Set(menuResponse.data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError(error.response?.data?.message || 'Failed to load menu. Please check the restaurant ID or try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    const params = new URLSearchParams(location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(table);
    }
  }, [userId, location]);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const placeOrder = async () => {
    try {
      if (!tableNumber.trim()) {
        alert('Please enter your table number');
        return;
      }

      if (!customerName.trim()) {
        alert('Please enter your name');
        return;
      }

      const itemsMap = {};
      cart.forEach((item) => {
        const key = item._id || item.id;
        if (!itemsMap[key]) {
          itemsMap[key] = { ...item, quantity: 0 };
        }
        itemsMap[key].quantity += 1;
      });

      const order = {
        items: Object.values(itemsMap).map(item => ({
          menuItemName: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity
        })),
        customerName: customerName.trim(),
        restaurantId: userId,
        tableNumber: tableNumber.trim(),
        totalAmount: cart.reduce((total, item) => total + item.price, 0)
      };

      const response = await axios.post(`${API_BASE_URL}/api/orders`, order);

      setCart([]);
      setShowCustomerForm(false);
      setShowCartSheet(false);
      setTableNumber('');
      setCustomerName('');
      setActiveOrder(response.data);

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order: ' + (error.response?.data?.message || error.message));
    }
  };

  const renderSkeletons = () => (
    <div className="menu-page">
      <div className="skeleton-banner shimmer"></div>
      <div className="skeleton-brand-bar">
        <div className="skeleton-logo shimmer"></div>
        <div className="brand-info">
          <div className="skeleton-title shimmer"></div>
          <div className="skeleton-meta shimmer"></div>
        </div>
      </div>
      <div className="skeleton-categories">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-cat shimmer"></div>)}
      </div>
      <div className="menu-grid-premium">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-card shimmer"></div>)}
      </div>
    </div>
  );

  if (loading) return renderSkeletons();

  if (error) {
    return (
      <div className="menu-container">
        <div className="error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <p style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>Restaurant ID: {userId}</p>
        </div>
      </div>
    );
  }

  if (!restaurantInfo) {
    return (
      <div className="menu-container">
        <div className="error">
          <i className="fas fa-exclamation-circle"></i>
          <p>Restaurant not found</p>
        </div>
      </div>
    );
  }

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  return (
    <div className="menu-page fade-in">
      <div className="immersive-header">
        <div className="header-banner" style={{ backgroundImage: `url(${restaurantInfo?.bannerImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=100&w=1500'})` }}>
          <div className="header-overlay"></div>
        </div>
        <div className="brand-bar">
          <div className="brand-logo-wrapper">
            {restaurantInfo?.profilePicture ? (
              <img src={restaurantInfo.profilePicture} alt="logo" className="brand-logo" loading="lazy" />
            ) : (
              <div className="brand-logo-placeholder">{restaurantInfo.restaurantName.charAt(0)}</div>
            )}
          </div>
          <div className="brand-info">
            <h1>{restaurantInfo.restaurantName}</h1>
            <div className="brand-meta">
              <span>📍 {tableNumber ? `Table ${tableNumber}` : 'Digital Menu'}</span>
              <span className="dot">•</span>
              <span>⭐ Premium Dining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky-nav-wrapper">
        <div className="search-bar-wrapper">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="categories-scroll-wrapper">
          <button
            className={`cat-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`cat-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid-premium">
        {filteredItems.map((item) => (
          <div key={item._id} className={`premium-item-card ${!item.available ? 'sold-out' : ''}`}>
            <div className="item-img-box">
              <img
                src={item.image || 'https://via.placeholder.com/300x200?text=Delicious+Food'}
                alt={item.name}
                loading="lazy"
              />
              {!item.available && <div className="sold-out-overlay">Sold Out</div>}
            </div>
            <div className="item-details">
              <div className="item-main-info">
                <h3>{item.name}</h3>
                <p className="item-desc">{item.description}</p>
              </div>
              <div className="item-footer">
                <span className="item-price">₹{item.price}</span>
                <button
                  className="add-btn-premium"
                  onClick={() => addToCart(item)}
                  disabled={!item.available}
                >
                  {cart.filter(c => c._id === item._id).length > 0 ? (
                    <span className="qty-count">{cart.filter(c => c._id === item._id).length}</span>
                  ) : (
                    <span className="add-plus">+</span>
                  )}
                  {cart.filter(c => c._id === item._id).length > 0 ? 'Added' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="no-results-premium">
            <i className="fas fa-utensils"></i>
            <p>No matches found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="floating-cart-bar" onClick={() => setShowCartSheet(true)}>
          <div className="cart-bar-info">
            <span className="cart-count-badge">{cart.length} Items</span>
            <span className="cart-bar-total">₹{cartTotal.toFixed(2)}</span>
          </div>
          <button className="view-cart-trigger">
            View Cart <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {showCartSheet && (
        <div className="cart-sheet-overlay" onClick={() => setShowCartSheet(false)}>
          <div className="cart-sheet-content" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="sheet-header">
              <h2>My Order</h2>
              <button className="clear-all" onClick={() => setCart([])}>Clear All</button>
            </div>

            {!showCustomerForm ? (
              <>
                <div className="sheet-items-list">
                  {[...new Set(cart.map(i => i._id))].map(id => {
                    const item = cart.find(i => i._id === id);
                    const qty = cart.filter(i => i._id === id).length;
                    return (
                      <div key={id} className="sheet-item-row">
                        <div className="sheet-item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">₹{item.price * qty}</span>
                        </div>
                        <div className="sheet-qty-ctrl">
                          <button onClick={() => {
                            const newCart = [...cart];
                            newCart.splice(cart.findIndex(i => i._id === id), 1);
                            setCart(newCart);
                          }}>-</button>
                          <span>{qty}</span>
                          <button onClick={() => addToCart(item)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="sheet-footer">
                  <div className="sheet-total-row">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button className="checkout-btn" onClick={() => setShowCustomerForm(true)}>
                    Continue to Order
                  </button>
                </div>
              </>
            ) : (
              <div className="checkout-form-sheet">
                <h3>Final Details</h3>
                <div className="form-group-sheet">
                  <label>Your Name</label>
                  <input
                    type="text"
                    placeholder="E.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group-sheet">
                  <label>Table Number</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  >
                    <option value="">Select Table</option>
                    {restaurantInfo?.tables?.map(num => (
                      <option key={num} value={num}>Table {num}</option>
                    ))}
                    {!restaurantInfo?.tables && [1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>Table {num}</option>
                    ))}
                  </select>
                </div>
                <div className="sheet-multi-actions">
                  <button className="btn-back-sheet" onClick={() => setShowCustomerForm(false)}>Back</button>
                  <button className="btn-confirm-sheet" onClick={placeOrder}>Place Order • ₹{cartTotal}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeOrder && (
        <OrderSuccessModal
          order={activeOrder}
          restaurantInfo={restaurantInfo}
          onClose={() => setActiveOrder(null)}
        />
      )}
    </div>
  );
};

export default Menu;
