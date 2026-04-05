import { useNavigate } from 'react-router-dom';
import * as api from '../api/client';
import PaymentScreenOverlay from '../components/PaymentScreenOverlay';
import PaymentSuccessOverlay from '../components/PaymentSuccessOverlay';
import { useState, useEffect } from 'react';
import { broadcastToDisplay, usePosStore } from '../store/posStore';

import { useAuthStore } from '../store/authStore';

export default function PaymentPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const { cart, session, selectedTableId, orderType, selectedCustomer, clearCart, resetForNewCustomer, activeOrder, setPaymentSuccess, paymentMethods, discountPercent, orderNote, paymentSuccessOrderNumber } = usePosStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [waitingForCustomer, setWaitingForCustomer] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ id: string, number: number, total: number } | null>(null);

  // Auto-resolve when customer completes payment on display
  useEffect(() => {
    if (waitingForCustomer && paymentSuccessOrderNumber && activeOrder?.number === paymentSuccessOrderNumber) {
        setSuccessOrder({ id: activeOrder.id, number: activeOrder.number, total: activeOrder.total });
        clearCart();
        setWaitingForCustomer(false);
        setIsProcessing(false);
    }
  }, [waitingForCustomer, paymentSuccessOrderNumber, activeOrder, clearCart]);

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  const taxRate = cart.length > 0 ? cart.reduce((acc, item) => acc + Number(item.product.tax), 0) / cart.length : 0;
  const taxAmount = subTotal * (taxRate / 100);
  const baseTotal = subTotal + taxAmount;
  const discountAmount = baseTotal * (discountPercent / 100);
  const total = baseTotal - discountAmount;

  const handleConfirmPayment = async (paymentMethodId: string) => {
    if (!token || !session || cart.length === 0) return;
    setIsProcessing(true);
    try {
      let targetOrderId = activeOrder?.id;
      let finalOrderNumber = activeOrder?.number;
      let finalTotal = activeOrder?.total;

      // 1. Create Order DB Reference if not already created
      if (!targetOrderId) {
        const order = await api.createOrder(token, {
          session_id: session.id,
          table_id: orderType === 'Take Away' ? null : selectedTableId,
          customer_id: selectedCustomer?.id || null,
          notes: orderNote || undefined,
          discount_percentage: discountPercent || undefined,
          items: cart.map(item => ({
            product_id: item.product.id,
            variant_id: item.variant?.id,
            quantity: item.quantity,
          })),
        });
        targetOrderId = order.id;
        finalOrderNumber = order.order_number;
        finalTotal = Number(order.total_amount);
      }

      // 2. Identify if payment method is "UPI" or "card" -> trigger Razorpay Gateway
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethodId);
      if (selectedMethod?.type === 'upi' || selectedMethod?.type === 'card' || selectedMethod?.name.toLowerCase().includes('upi') || selectedMethod?.name.toLowerCase().includes('card') || selectedMethod?.name.toLowerCase().includes('razorpay')) {
        const rzpResponse = await api.createRazorpayOrder(token, targetOrderId);
        
        setWaitingForCustomer(true);
        // Delegate completion to the Customer Display Device
        broadcastToDisplay('TRIGGER_PAYMENT', {
            targetOrderId,
            paymentMethodId,
            finalOrderNumber,
            finalTotal,
            rzpResponse
        });
        
        return; // Halt here since callback function on the other device handles the rest
      }

      // 3. Fallback to normal Cash processing
      await api.payOrder(token, targetOrderId, paymentMethodId);
      
      setPaymentSuccess(finalOrderNumber!);
      setSuccessOrder({ id: targetOrderId, number: finalOrderNumber!, total: finalTotal! });
      clearCart();
    } catch (err: any) {
      alert(`Payment routing failed: ${err.message}`);
      setIsProcessing(false);
    } 
  };

  const handleCloseSuccess = () => {
    setSuccessOrder(null);
    setPaymentSuccess(null);
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