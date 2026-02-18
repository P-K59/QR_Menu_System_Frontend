import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../config';
import './OrderSuccessModal.css';

const OrderSuccessModal = ({ order, onClose, restaurantInfo }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [estimatedTime, setEstimatedTime] = useState(20);

  useEffect(() => {
    if (!currentOrder) return;

    // Connect to WebSocket for real-time updates
    const socket = io(`${API_BASE_URL}`);
    socket.emit('join', currentOrder.restaurantId);

    socket.on('orderUpdated', (updatedOrder) => {
      if (updatedOrder._id === currentOrder._id) {
        setCurrentOrder(updatedOrder);
        // Update estimated time based on status
        switch (updatedOrder.status) {
          case 'process':
            setEstimatedTime(15);
            break;
          case 'complete':
            setEstimatedTime(0);
            break;
          default:
            setEstimatedTime(20);
        }
      }
    });

    return () => socket.disconnect();
  }, [currentOrder]);

  const getStatusStep = () => {
    switch (currentOrder?.status) {
      case 'pending': return 1;
      case 'process': return 2;
      case 'ready': return 3;
      case 'billed': return 4;
      case 'complete': return 4;
      default: return 1;
    }
  };

  const getStatusMessage = () => {
    switch (currentOrder?.status) {
      case 'pending': return 'Your order has been received and is waiting to be prepared';
      case 'process': return 'Your order is being prepared by our kitchen staff';
      case 'ready': return 'Your order is ready! It will be served shortly';
      case 'billed': return 'Bill Generated! You can view your digital receipt below';
      case 'complete': return 'Order Completed! Thank you for dining with us';
      case 'cancelled': return 'Your order has been cancelled';
      default: return 'Processing your order';
    }
  };

  const currentStep = getStatusStep();
  const isCancelled = currentOrder.status === 'cancelled';
  const isComplete = currentOrder.status === 'complete';
  const isBilled = currentOrder.status === 'billed';

  const downloadReceipt = async () => {
    const element = document.querySelector('.printable-bill-template');
    if (!element) return;

    // Temporarily show the template for capturing
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.left = '-9999px';

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 380,
        windowHeight: element.scrollHeight // Ensure full height is captured
      });
      const imgData = canvas.toDataURL('image/png');

      // Calculate dynamic PDF size
      const imgProps = { width: canvas.width, height: canvas.height };
      const pdfWidth = 80; // Standard receipt width in mm
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${currentOrder._id.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Could not generate receipt. Please try printing instead.');
    } finally {
      // Restore original display
      element.style.display = 'none';
      element.style.position = 'absolute';
      element.style.left = '0';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>

        {/* Success Header */}
        {!isCancelled && (
          <div className="success-header">
            {isComplete ? (
              <div className="success-icon completed">
                <i className="fas fa-check"></i>
              </div>
            ) : (
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
            <h2>Order Confirmed!</h2>
            <p className="order-id">Order #{currentOrder._id.slice(-4).toUpperCase()}</p>
          </div>
        )}

        {isCancelled && (
          <div className="cancel-header">
            <div className="cancel-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <h2>Order Cancelled</h2>
          </div>
        )}

        {/* Order Details Summary */}
        <div className="order-summary">
          <div className="summary-item">
            <span className="label"><i className="fas fa-user"></i> Name</span>
            <span className="value">{currentOrder.customerName}</span>
          </div>
          <div className="summary-item">
            <span className="label"><i className="fas fa-chair"></i> Table</span>
            <span className="value">{currentOrder.tableNumber}</span>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="status-timeline">
            <div className={`timeline-item ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="timeline-dot"><i className="fas fa-shopping-cart"></i></div>
              <span className="timeline-text">Received</span>
            </div>
            <div className={`timeline-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`timeline-item ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="timeline-dot"><i className="fas fa-utensils"></i></div>
              <span className="timeline-text">Preparing</span>
            </div>
            <div className={`timeline-line ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`timeline-item ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="timeline-dot"><i className="fas fa-bell"></i></div>
              <span className="timeline-text">Ready</span>
            </div>
            <div className={`timeline-line ${currentStep >= 4 ? 'active' : ''}`}></div>
            <div className={`timeline-item ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="timeline-dot"><i className="fas fa-receipt"></i></div>
              <span className="timeline-text">{isBilled ? 'Billed' : 'Done'}</span>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className={`status-message ${currentOrder.status}`}>
          <p>{getStatusMessage()}</p>
        </div>

        {/* Estimated Time */}
        {!isCancelled && estimatedTime > 0 && (
          <div className="estimated-time">
            <i className="fas fa-clock"></i>
            <span>Estimated time: {estimatedTime} mins</span>
          </div>
        )}

        {/* Order Items */}
        <div className="order-items-scroll">
          <h3>Items</h3>
          {currentOrder.items.map((item, index) => (
            <div key={index} className="item-row">
              <span className="item-qty">{item.quantity}x</span>
              <span className="item-name">{item.menuItemName}</span>
              <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="order-total">
            <span>Total</span>
            <span>₹{currentOrder.totalAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="modal-actions">
          {isBilled && (
            <button onClick={downloadReceipt} className="action-btn secondary">
              <i className="fas fa-download"></i> Download Receipt
            </button>
          )}
          <button onClick={onClose} className="action-btn primary">Order More</button>
        </div>
      </div>

      {/* DEDICATED PRINTABLE BILL TEMPLATE (Hidden by default) */}
      <div className="printable-bill-template">
        <div className="bill-header">
          <h1>{restaurantInfo?.restaurantName || 'RESTAURANT'}</h1>
          <p className="bill-subtitle">Digital Receipt</p>
          <div className="bill-divider"></div>
        </div>

        <div className="bill-info">
          <p><span>Order ID:</span> <span>#{currentOrder._id.slice(-6).toUpperCase()}</span></p>
          <p><span>Date:</span> <span>{new Date(currentOrder.createdAt).toLocaleString()}</span></p>
          <p><span>Customer:</span> <span>{currentOrder.customerName}</span></p>
          <p><span>Table No:</span> <span>{currentOrder.tableNumber}</span></p>
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
            {currentOrder.items.map((item, index) => (
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
          <span>₹{currentOrder.totalAmount?.toFixed(2)}</span>
        </div>

        <div className="bill-footer">
          <p>Thank you for visiting!</p>
          <p>Please come again.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
