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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const table = searchParams.get('table');
    if (table) setTableNumber(table);
    
    fetchMenu();
  }, [userId]);

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

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const placeOrder = async () => {
    try {
      if (!tableNumber) {
        alert('Please scan the QR code from your table to place an order');
        return;
      }

      const order = {
        items: cart.map(item => ({
          menuItem: item._id,
          quantity: cart.filter(cartItem => cartItem._id === item._id).length
        })),
        restaurantId: userId,
        tableNumber: parseInt(tableNumber),
        totalAmount: cart.reduce((total, item) => total + item.price, 0)
      };

      await axios.post('http://localhost:5000/api/orders', order);
      alert('Order placed successfully! The restaurant staff will bring your order to table ' + tableNumber);
      setCart([]);
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
      <div className="menu-header">
        <h1>{restaurantInfo.restaurantName}</h1>
        {tableNumber && <h2>Table {tableNumber}</h2>}
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
              <p className="price">${item.price}</p>
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
                  <div className="cart-item-price">${item.price}</div>
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
            <span>${cart.reduce((total, item) => total + item.price, 0).toFixed(2)}</span>
          </div>
          <button className="place-order-btn" onClick={placeOrder}>
            Place Order
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;