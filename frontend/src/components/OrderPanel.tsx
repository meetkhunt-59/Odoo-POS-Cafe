import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Edit2, Minus, Plus, Trash2 } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import PaymentSuccessOverlay from './PaymentSuccessOverlay';
import './OrderPanel.css';

export default function OrderPanel() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const profile = useAuthStore((s) => s.profile);
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCartOnly,
    selectedTableId,
    session,
    tables,
  } = usePosStore();

  const [successOrder, setSuccessOrder] = useState<{ id: string, number: number, total: number } | null>(null);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const taxRate = cart.length > 0
    ? cart.reduce((acc, item) => acc + Number(item.product.tax), 0) / cart.length
    : 0;
  const taxAmount = subTotal * (taxRate / 100);
  const total = subTotal + taxAmount;

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleSendToKitchen = async () => {
    if (!token || !session || cart.length === 0) return;
    try {
      const order = await api.createOrder(token, {
        session_id: session.id,
        table_id: selectedTableId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id, // Support variants
          quantity: item.quantity,
        })),
      });
      
      clearCartOnly(); // Isolated dispatch: clear cart but keep table
      alert(`Order #${order.order_number} sent to kitchen!`);
    } catch (err: any) {
      alert(`Failed to send order: ${err.message}`);
    }
  };


  return (
    <aside className="order-panel">
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="table-title">
            {selectedTable ? `Table ${selectedTable.table_number}` : 'No Table'}
          </h2>
          <span className="waiter-name">{profile?.name || 'Staff'}</span>
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
            className={`tab-btn ${type === 'Dine In' ? 'active' : ''}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Scrollable Order Items */}
      <div className="order-items-scroll">
        {cart.length === 0 && (
          <div className="cart-empty">
            <p>Cart is empty</p>
            <span>Tap products to add them</span>
          </div>
        )}
        {cart.map((item) => (
          <div key={item.product.id} className="cart-item">
            <div className="item-thumbnail-emoji">
              📦
            </div>
            <div className="item-details">
              <span className="item-name">{item.product.name}</span>
              <div className="item-price-row">
                <span className="item-price">₹{Number(item.product.price).toFixed(2)}</span>
                <div className="item-qty-controls">
                  <button className="qty-btn" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                    <Minus size={14} />
                  </button>
                  <span className="item-qty">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="item-right">
              <div className="item-total">
                ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
              </div>
              <button className="item-remove" onClick={() => removeFromCart(item.product.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="totals-row">
          <span className="totals-label">Sub Total</span>
          <span className="totals-value">₹{subTotal.toFixed(2)}</span>
        </div>
        <div className="totals-row">
          <span className="totals-label">Tax {taxRate.toFixed(0)}%</span>
          <span className="totals-value">₹{taxAmount.toFixed(2)}</span>
        </div>
        <div className="totals-row grand-total">
          <span className="totals-label bold">Total Amount</span>
          <span className="totals-value bold">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Row removed from sidebar - now in overlay */}

      {/* Action Buttons: Split Flow */}
      <div className="cta-container dual-actions">
        <button
          className="send-kitchen-btn"
          onClick={handleSendToKitchen}
          disabled={cart.length === 0 || !session}
        >
          Send to Kitchen
        </button>
        <button
          className="pay-btn"
          onClick={() => navigate('/pos/payment')}
          disabled={cart.length === 0 || !session}
        >
          {cart.length === 0 ? 'Select Items' : `Checkout — ₹${total.toFixed(2)}`}
        </button>
      </div>

      {successOrder && (
        <PaymentSuccessOverlay 
          orderNumber={successOrder.number}
          total={successOrder.total}
          onClose={() => {
            setSuccessOrder(null);
            navigate('/pos/tables'); // Auto-return to Floor mapping
          }}
        />
      )}
    </aside>
  );
}
