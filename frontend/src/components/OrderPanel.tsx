import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import PaymentSuccessOverlay from './PaymentSuccessOverlay';
import CustomerSelectionModal from './CustomerSelectionModal';
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
    selectedCustomer,
    setSelectedCustomer,
    discountPercent,
    setDiscountPercent,
    orderNote,
    setOrderNote,
    orderType,
    setOrderType,
    markTableBusy
  } = usePosStore();

  const [successOrder, setSuccessOrder] = useState<{ id: string, number: number, total: number } | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const taxRate = cart.length > 0
    ? cart.reduce((acc, item) => acc + Number(item.product.tax), 0) / cart.length
    : 0;
  const taxAmount = subTotal * (taxRate / 100);
  const baseTotal = subTotal + taxAmount;
  const discountAmount = baseTotal * (discountPercent / 100);
  const total = baseTotal - discountAmount;

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
        customer_id: selectedCustomer?.id || null,
        notes: orderNote || undefined,
        discount_percentage: discountPercent || undefined,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id, // Support variants
          quantity: item.quantity,
        })),
      });
      
      usePosStore.getState().setActiveOrder({ id: order.id, number: order.order_number, total: Number(order.total_amount) });
      if (selectedTableId && orderType !== 'Take Away') {
        markTableBusy(selectedTableId, true);
      }
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

      {/* Selected Customer Inline UI */}
      <div className="customer-selection-area" style={{ padding: '0 16px', marginBottom: '8px' }}>
        {selectedCustomer ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3F4F6', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>👤 {selectedCustomer.name}</div>
            <button 
              onClick={() => setSelectedCustomer(null)} 
              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              Remove
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowCustomerModal(true)}
            style={{ width: '100%', padding: '10px', background: '#eef2ff', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            + Add Customer (Optional)
          </button>
        )}
      </div>

      {/* Scrollable Order Items */}
      <div className="order-items-scroll">
        {cart.length === 0 && (
          <div className="cart-empty">
            <span style={{ fontSize: '32px' }}>☕</span>
            <span>Select product</span>
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

      {/* Custom Inputs */}
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <input 
          type="text" 
          placeholder="Add order note..." 
          value={orderNote}
          onChange={e => setOrderNote(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>Discount %</span>
          <input 
            type="number" 
            min="0" max="100" 
            placeholder="0" 
            value={discountPercent || ''}
            onChange={e => setDiscountPercent(Number(e.target.value))}
            style={{ width: '60px', padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px' }}
          />
        </div>
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
        {discountPercent > 0 && (
          <div className="totals-row" style={{ color: '#10B981' }}>
            <span className="totals-label">Discount ({discountPercent}%)</span>
            <span className="totals-value">-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="totals-row grand-total">
          <span className="totals-label bold">Total</span>
          <span className="totals-value bold">₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons: Side by Side */}
      <div className="cta-container dual-actions">
        {orderType === 'Dine In' && (
           <button
             className="send-kitchen-btn"
             onClick={handleSendToKitchen}
             disabled={cart.length === 0}
           >
             Send to Kitchen
           </button>
        )}
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
          Pay Now
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

      {showCustomerModal && (
        <CustomerSelectionModal onClose={() => setShowCustomerModal(false)} />
      )}
    </aside>
  );
}