import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Order = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div className="order-container">
      <h1>Orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <h3>Order #{order._id}</h3>
            <p>Table: {order.tableNumber}</p>
            <p>Status: {order.status}</p>
            <p>Total: ${order.totalAmount}</p>
            <ul>
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.menuItem.name} x {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Order;