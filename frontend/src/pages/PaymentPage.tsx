import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import PaymentScreenOverlay from '../components/PaymentScreenOverlay';
import PaymentSuccessOverlay from '../components/PaymentSuccessOverlay';
import { useState } from 'react';

export default function PaymentPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { cart, session, selectedTableId, clearCart, resetForNewCustomer } = usePosStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ id: string, number: number, total: number } | null>(null);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const total = subTotal; // Simplified for payment screen

  const handleConfirmPayment = async (paymentMethodId: string) => {
    if (!token || !session || cart.length === 0) return;
    setIsProcessing(true);
    try {
      const order = await api.createOrder(token, {
        session_id: session.id,
        table_id: selectedTableId,
        items: cart.map(item => ({
          product_id: item.product.id,
          variant_id: item.variant?.id,
          quantity: item.quantity,
        })),
      });

      await api.payOrder(token, order.id, paymentMethodId);
      setSuccessOrder({ id: order.id, number: order.order_number, total: order.total_amount });
      clearCart();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessOrder(null);
    resetForNewCustomer(); // Step 1 cleanup: indicate next order
    navigate('/'); // Return to Dashboard per flow initiation
  };

  if (!cart.length && !successOrder) {
    return (
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p>No active order to pay for.</p>
          <button onClick={() => navigate('/pos')}>Go back</button>
       </div>
    );
  }

  return (
    <div className="payment-page">
       {!successOrder ? (
         <PaymentScreenOverlay
           total={total}
           isProcessing={isProcessing}
           onCancel={() => navigate('/pos')}
           onConfirm={handleConfirmPayment}
         />
       ) : (
         <PaymentSuccessOverlay
           orderNumber={successOrder.number}
           total={successOrder.total}
           onClose={handleCloseSuccess}
         />
       )}
    </div>
  );
}
