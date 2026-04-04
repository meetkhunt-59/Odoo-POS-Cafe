import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Clock, PlayCircle, Loader2, AlertCircle } from 'lucide-react';
import './CustomerPage.css';

interface OrderStatus {
  id: string;
  order_number: number;
  kitchen_status: string;
  payment_status: string;
  total_amount: number;
}

export default function CustomerPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`http://localhost:8000/terminal/display/customer/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="customer-page">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Fetching your order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="customer-page">
        <AlertCircle size={48} color="var(--accent-red)" />
        <h2>Oops! Order Not Found</h2>
        <p>Please check the order number or ask the staff for help.</p>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (order.kitchen_status) {
      case 'to_cook':
        return { icon: Clock, label: 'Received', sub: 'Our chefs will start cooking soon', color: '#F59E0B' };
      case 'preparing':
        return { icon: PlayCircle, label: 'Preparing', sub: 'Your meal is being cooked right now', color: '#10B981' };
      case 'completed':
        return { icon: CheckCircle2, label: 'Ready!', sub: 'Please collect your order at the counter', color: '#3B82F6' };
      case 'cancelled':
        return { icon: AlertCircle, label: 'Cancelled', sub: 'This order has been cancelled', color: '#EF4444' };
      default:
        return { icon: Clock, label: 'Processing', sub: 'Hang tight!', color: '#6B7280' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="customer-page">
      <div className="status-card">
        <div className="status-header">
          <div className="order-badge">Order #{order.order_number}</div>
          <div className="payment-badge">{order.payment_status.toUpperCase()}</div>
        </div>

        <div className="status-visual">
          <div className="icon-circle" style={{ backgroundColor: `${config.color}15` }}>
            <config.icon size={64} color={config.color} />
          </div>
          <h1>{config.label}</h1>
          <p>{config.sub}</p>
        </div>

        <div className="status-steps">
          <div className={`step-item ${['to_cook', 'preparing', 'completed'].includes(order.kitchen_status) ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Ordered</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${['preparing', 'completed'].includes(order.kitchen_status) ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Cooking</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${order.kitchen_status === 'completed' ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Ready</span>
          </div>
        </div>

        <div className="status-footer">
          <div className="total-row">
            <span>Total Amount</span>
            <span className="total-val">₹{Number(order.total_amount).toFixed(2)}</span>
          </div>
          <p className="thank-you">Thank you for dining with Odoo POS Cafe! 🌿</p>
        </div>
      </div>
    </div>
  );
}