import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import './Menu.css';

const Menu = () => {
  const { userId } = useParams();
  const location = useLocation();
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Ensure this is a customer-only view - logout if logged in
  useEffect(() => {
    // This is the public customer menu page, not for logged in admins
    // Customers should access via QR code or direct link without authentication
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const [menuResponse, restaurantResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/menu/${userId}`),
        axios.get(`http://localhost:5000/api/users/${userId}`)
      ]);
      
      setMenuItems(menuResponse.data);
      setRestaurantInfo(restaurantResponse.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(menuResponse.data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Count items by id
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

      await axios.post('http://localhost:5000/api/orders', order);
      alert('Order placed successfully! The restaurant staff will bring your order to table ' + tableNumber);
      setCart([]);
      setCustomerName('');
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
  };

  if (loading) {
    return (
      <div className="menu-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading menu...</p>
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

  return (
    <div className="menu-container">
      {restaurantInfo?.bannerImage && (
        <div style={{ 
          width: '100%', 
          height: '200px', 
          backgroundImage: `url(${restaurantInfo.bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '8px',
          marginBottom: '20px'
        }} />
      )}
      
      <div className="menu-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {restaurantInfo?.profilePicture && (
              <img 
                src={restaurantInfo.profilePicture} 
                alt={restaurantInfo.restaurantName}
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid #2196F3'
                }} 
              />
            )}
            <div>
              <h1>{restaurantInfo.restaurantName}</h1>
            </div>
          </div>
          <a href="/" style={{ color: '#2196F3', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
        </div>
      </div>

      <div className="categories">
        <button 
          className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {menuItems
          .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
          .map((item) => (
          <div key={item._id} className="menu-item">
            <img src={item.image || 'https://via.placeholder.com/300x200'} alt={item.name} />
            <div className="menu-item-content">
              <h3>{item.name}</h3>
              <p className="description">{item.description}</p>
              <p className="price">₹{item.price}</p>
              <button className="add-to-cart" onClick={() => addToCart(item)}>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="cart-container">
          <div className="cart-header">
            <h2>Your Cart</h2>
            <button onClick={() => setCart([])} className="clear-cart">
              Clear Cart
            </button>
          </div>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{item.price}</div>
                </div>
                <div className="cart-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => {
                      const newCart = [...cart];
                      newCart.splice(cart.indexOf(item), 1);
                      setCart(newCart);
                    }}
                  >
                    -
                  </button>
                  <span>{cart.filter(cartItem => cartItem._id === item._id).length}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setCart([...cart, item])}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>Total:</span>
            <span>₹{cart.reduce((total, item) => total + item.price, 0).toFixed(2)}</span>
          </div>
          
          {!showCustomerForm ? (
            <button className="place-order-btn" onClick={() => setShowCustomerForm(true)}>
              Continue to Checkout
            </button>
          ) : (
            <div className="customer-form" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                autoFocus
              />
              <input
                type="text"
                placeholder="Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="place-order-btn" 
                  onClick={placeOrder}
                  style={{ flex: 1 }}
                >
                  Place Order
                </button>
                <button 
                  onClick={() => {
                    setShowCustomerForm(false);
                    setCustomerName('');
                    setTableNumber('');
                  }}
                  style={{ flex: 1, backgroundColor: '#f44336', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Menu;