import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
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
    removeFromCart,
    selectedTableId,
    session,
    tables,
  } = usePosStore();

  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [successOrder, setSuccessOrder] = useState<{ id: string, number: number, total: number } | null>(null);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const taxRate = cart.length > 0
    ? cart.reduce((acc, item) => acc + Number(item.product.tax), 0) / cart.length
    : 0;
  const taxAmount = subTotal * (taxRate / 100);
  const total = subTotal + taxAmount;

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const handleSendToKitchen = async () => {
    if (cart.length === 0 || !token) return;
    
    let currentSession = session;
    if (!currentSession) {
      try {
        currentSession = await api.openSession(token);
        usePosStore.setState({ session: currentSession });
      } catch (e: any) {
        alert("System Error: Could not verify or create a valid POS session. " + e.message);
        return;
      }
    }

    if (orderType === 'Dine In' && !selectedTableId) {
      alert("Please select a table on the Tables screen first.");
      return;
    }
    
    try {
      const order = await api.createOrder(token, {
        session_id: currentSession.id,
        table_id: orderType === 'Take Away' ? null : selectedTableId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id, // Support variants
          quantity: item.quantity,
        })),
      });
      
      usePosStore.getState().setActiveOrder({ id: order.id, number: order.order_number, total: Number(order.total_amount) });
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
            {orderType === 'Take Away' ? 'Take Away' : (selectedTable ? `Table ${selectedTable.table_number}` : 'No Table')}
          </h2>
          <span className="waiter-name">{profile?.name || 'Staff'}</span>
        </div>
        <button className="edit-btn">
          <Edit2 size={16} />
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="order-type-tabs">
        {(['Dine In', 'Take Away'] as const).map(type => (
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
        {cart.length === 0 && (
          <div className="cart-empty">
            <p>Cart is empty</p>
            <span>Tap products to add them</span>
          </div>
        )}
        {cart.map((item) => (
          <div key={item.product.id} className="cart-item-simplified">
            <div className="item-left-side">
              <button className="simplified-remove" onClick={() => removeFromCart(item.product.id)}>
                <Trash2 size={14} />
              </button>
              <span className="item-qty">{item.quantity} x</span>
              <span className="item-name">{item.product.name}</span>
            </div>
            
            <div className="item-right-side">
              ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
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
          <span className="totals-label bold">Total</span>
          <span className="totals-value bold">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons: Side by Side */}
      <div className="cta-container dual-actions">
        <button
          className="send-kitchen-btn"
          onClick={handleSendToKitchen}
          disabled={cart.length === 0}
        >
          Send to Kitchen
        </button>
        <button
          className="pay-btn"
          onClick={async () => {
            let currentSession = session;
            if (!currentSession) {
              try {
                currentSession = await api.openSession(token!);
                usePosStore.setState({ session: currentSession });
              } catch (e: any) {
                alert("System Error: Could not open session. " + e.message);
                return;
              }
            }
            navigate('/pos/payment');
          }}
          disabled={cart.length === 0}
        >
          {cart.length === 0 ? 'Payment' : `Pay ₹${total.toFixed(2)}`}
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
