import { usePosStore } from '../store/posStore';
import './CustomerDisplayPage.css';

export default function CustomerDisplayPage() {
  const { cart, selectedTableId, tables, paymentSuccessOrderNumber, discountPercent } = usePosStore();
  
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