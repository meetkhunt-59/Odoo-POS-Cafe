import React, { useState } from 'react';
import { Edit2, Banknote, CreditCard, QrCode } from 'lucide-react';
import './OrderPanel.css';

export default function OrderPanel() {
  const [orderType, setOrderType] = useState('Dine In');
  const [paymentMethod, setPaymentMethod] = useState('');

  const cartItems = [
    {
      id: 1,
      name: 'Original Chess Meat Burger With Chips (Non Veg)',
      price: 23.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 2,
      name: 'Fresh Orange Juice With Basil Seed No Sugar (Veg)',
      price: 12.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=150&q=80',
    }
  ];

  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subTotal * 0.05;
  const total = subTotal + tax;

  return (
    <aside className="order-panel">
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="table-title">Table 4</h2>
          <span className="waiter-name">Floyd Miles</span>
        </div>
        <button className="edit-btn">
          <Edit2 size={16} />
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="order-type-tabs">
        {['Dine In', 'Take Away', 'Delivery'].map(type => (
          <button 
            key={type}
            className={`tab-btn ${orderType === type ? 'active' : ''}`}
            onClick={() => setOrderType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Scrollable Order Items */}
      <div className="order-items-scroll">
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <div className="item-details">
              <span className="item-name">{item.name}</span>
              <div className="item-price-row">
                <span className="item-price">${item.price.toFixed(2)}</span>
                <span className="item-qty">{item.quantity}X</span>
              </div>
            </div>
            <div className="item-total">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="totals-row">
          <span className="totals-label">Sub Total</span>
          <span className="totals-value">${subTotal.toFixed(2)}</span>
        </div>
        <div className="totals-row">
          <span className="totals-label">Tax 5%</span>
          <span className="totals-value">${tax.toFixed(2)}</span>
        </div>
        <div className="totals-row grand-total">
          <span className="totals-label bold">Total Amount</span>
          <span className="totals-value bold">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Row */}
      <div className="payment-methods">
        <button 
          className={`payment-card ${paymentMethod === 'Cash' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('Cash')}
        >
          <Banknote size={24} />
          <span>Cash</span>
        </button>
        <button 
          className={`payment-card ${paymentMethod === 'Card' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('Card')}
        >
          <CreditCard size={24} />
          <span>Card</span>
        </button>
        <button 
          className={`payment-card ${paymentMethod === 'QR' ? 'active' : ''}`}
          onClick={() => setPaymentMethod('QR')}
        >
          <QrCode size={24} />
          <span>QR Code</span>
        </button>
      </div>

      {/* Place Order CTA */}
      <div className="cta-container">
        <button className="place-order-btn">
          Place Order
        </button>
      </div>
    </aside>
  );
}
