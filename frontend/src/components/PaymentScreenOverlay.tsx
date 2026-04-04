import { Banknote, CreditCard, QrCode, X } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import './PaymentScreenOverlay.css';
import { useState } from 'react';

interface Props {
  total: number;
  onCancel: () => void;
  onConfirm: (paymentMethodId: string) => void;
  isProcessing: boolean;
}

export default function PaymentScreenOverlay({ total, onCancel, onConfirm, isProcessing }: Props) {
  const { paymentMethods } = usePosStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
    }
  };

  return (
    <div className="payment-overlay" onClick={onCancel}>
      <div className="payment-card-dialog" onClick={e => e.stopPropagation()}>
        <div className="payment-header">
          <h2>Select Payment Method</h2>
          <button className="close-btn" onClick={onCancel}><X size={24} /></button>
        </div>
        
        <div className="payment-total-display">
          <span>Amount Due</span>
          <span className="total-due">₹{total.toFixed(2)}</span>
        </div>

        <div className="payment-methods-grid">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((pm) => (
              <button
                key={pm.id}
                className={`payment-method-card ${selectedMethod === pm.id ? 'active' : ''}`}
                onClick={() => setSelectedMethod(pm.id)}
              >
                {pm.type === 'cash' ? <Banknote size={40} /> : pm.type === 'upi' ? <QrCode size={40} /> : <CreditCard size={40} />}
                <span>{pm.name}</span>
              </button>
            ))
          ) : (
            <div className="no-methods">No payment methods configured.</div>
          )}
        </div>

        <button 
          className="confirm-payment-btn"
          disabled={!selectedMethod || isProcessing}
          onClick={handleConfirm}
        >
          {isProcessing ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}
