import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { useAuthStore } from '../store/authStore';
import './CustomerDisplayPage.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CustomerDisplayPage() {
  const token = useAuthStore(s => s.token);
  
  const [cart, setCart] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentSuccessOrderNumber, setPaymentSuccessOrderNumber] = useState<number | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/display';
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => console.log('Customer Display Listening');
    
    socket.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.action === 'SYNC_CART') {
           // If we just hit a success state, freeze the cart details visually
           if (payload.data.paymentSuccessOrderNumber) {
               setPaymentSuccessOrderNumber(payload.data.paymentSuccessOrderNumber);
               return; 
           }
           
           setCart(payload.data.cart || []);
           setDiscountPercent(payload.data.discountPercent || 0);
           setSelectedTableId(payload.data.selectedTableId || null);
           setPaymentSuccessOrderNumber(payload.data.paymentSuccessOrderNumber || null);
           if (payload.data.tables) setTables(payload.data.tables);
        }
        else if (payload.action === 'TRIGGER_PAYMENT') {
           // Intercept Razorpay processing here!
           const { targetOrderId, paymentMethodId, finalOrderNumber, rzpResponse } = payload.data;
           
           const isLoaded = await loadRazorpayScript();
           if (!isLoaded) return;
           
           const options = {
             key: rzpResponse.key_id,
             amount: rzpResponse.amount,
             currency: rzpResponse.currency,
             name: "Odoo POS Cafe Sandbox",
             description: `Order #${finalOrderNumber}`,
             order_id: rzpResponse.razorpay_order_id,
             handler: async function () {
                try {
                  await api.payOrder(token!, targetOrderId, paymentMethodId);
                  setPaymentSuccessOrderNumber(finalOrderNumber);
                  
                  // Broadcast Success back so the master terminal unblocks
                  socket.send(JSON.stringify({
                      action: 'PAYMENT_SUCCESS',
                      data: { order_number: finalOrderNumber }
                  }));
                } catch(err) {
                  alert("Finalizing payment failed on Server!");
                }
             },
             theme: { color: "#3B82F6" }
           };
           
           const rzp = new (window as any).Razorpay(options);
           rzp.open();
        }
      } catch(e) {}
    };

    setWs(socket);
    return () => socket.close();
  }, [token]);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const taxRate = cart.length > 0 ? cart.reduce((acc, item) => acc + Number(item.product.tax), 0) / cart.length : 0;
  const taxAmount = subTotal * (taxRate / 100);
  const baseTotal = subTotal + taxAmount;
  const discountAmount = baseTotal * (discountPercent / 100);
  const total = baseTotal - discountAmount;

  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="cfd-container">
      <div className="cfd-main">
        <header className="cfd-header">
           <div className="brand">Odoo POS Cafe </div>
           <div className="table-info">
             {selectedTable ? `Table ${selectedTable.table_number}` : 'Welcome!'}
           </div>
        </header>

        <div className="cfd-body">
           <div className="cfd-cart">
              <h2>Current Order</h2>
              {paymentSuccessOrderNumber ? (
                <div className="success-msg-cfd">
                   <h2>✅ Payment Successful!</h2>
                   <p>Your Order #{paymentSuccessOrderNumber} is preparing.</p>
                   <p className="thank-you">Thank you for dining with us!</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="empty-msg">Your items will appear here...</div>
              ) : (
                <div className="cart-list invoice-style">
                  <div className="invoice-header">
                    <span className="inv-qty">Qty</span>
                    <span className="inv-item">Item</span>
                    <span className="inv-price">Amount</span>
                  </div>
                  {cart.map(item => (
                    <div key={item.product.id} className="invoice-row">
                       <span className="inv-qty">{item.quantity}</span>
                       <span className="inv-item">{item.product.name}</span>
                       <span className="inv-price">₹{(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="cfd-summary">
              <div className="summary-row">
                 <span>Sub Total</span>
                 <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                 <span>Tax ({taxRate.toFixed(0)}%)</span>
                 <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="summary-row discount">
                   <span>Discount ({discountPercent}%)</span>
                   <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row total">
                 <span>Total</span>
                 <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="promo-message">Enjoy your meal!</div>
           </div>
        </div>
      </div>
      
      <div className="cfd-footer-scroll">
         <span>Special Offer: Get 10% off on your next visit! • Fresh Ingredients Daily • contactless Payment Available</span>
      </div>
    </div>
  );
}