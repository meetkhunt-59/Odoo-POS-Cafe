import { usePosStore } from '../store/posStore';
import './CustomerDisplayPage.css';

export default function CustomerDisplayPage() {
  const { cart, selectedTableId, tables, paymentSuccessOrderNumber } = usePosStore();
  
  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="cfd-container">
      <div className="cfd-main">
        <header className="cfd-header">
           <div className="brand">CHILI POS 🌿</div>
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
                <div className="cart-list">
                  {cart.map(item => (
                    <div key={item.product.id} className="cart-row">
                       <span className="qty">{item.quantity}x</span>
                       <span className="name">{item.product.name}</span>
                       <span className="price">₹{(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="cfd-summary">
              <div className="summary-row">
                 <span>Subtotal</span>
                 <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                 <span>Total Amount</span>
                 <span>₹{subTotal.toFixed(2)}</span>
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
