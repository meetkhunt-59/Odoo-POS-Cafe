import { CheckCircle2, ChevronRight, Printer, Share2 } from 'lucide-react';
import './PaymentSuccessOverlay.css';

interface Props {
  orderNumber: string | number;
  total: number;
  onClose: () => void;
}

export default function PaymentSuccessOverlay({ orderNumber, total, onClose }: Props) {
  return (
    <div className="success-overlay" onClick={onClose}>
      <div className="success-card" onClick={e => e.stopPropagation()}>
        <div className="success-icon">
          <CheckCircle2 size={80} />
        </div>
        
        <div className="success-text">
          <h2>Payment Successful!</h2>
          <p>Order <strong>#{orderNumber}</strong> is now being prepared in the kitchen.</p>
        </div>

        <div className="receipt-summary">
          <div className="summary-row">
            <span>Amount Paid</span>
            <span className="amount">₹{total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Status</span>
            <span className="status-pill">Paid</span>
          </div>
        </div>

        <div className="success-actions">
           <button className="print-btn">
             <Printer size={20} />
             Print Receipt
           </button>
           <button className="share-btn">
             <Share2 size={20} />
           </button>
        </div>

        <button className="done-btn" onClick={onClose}>
          Done & Next Order
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}