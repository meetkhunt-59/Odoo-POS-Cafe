import { useState, useEffect } from 'react';
import * as api from '../api/client';
import { useAuthStore } from '../store/authStore';
import './OrderStatusPage.css';

interface OrderStatus {
  order_number: number;
  kitchen_status: string;
}

export default function OrderStatusPage() {
  const token = useAuthStore(s => s.token);
  const [orders, setOrders] = useState<OrderStatus[]>([]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await api.getKitchenOrders(token);
      setOrders(res as any);
    } catch (err) {
      console.error("Failed to fetch order statuses", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const preparing = orders.filter(o => o.kitchen_status === 'to_cook' || o.kitchen_status === 'preparing');
  const ready = orders.filter(o => o.kitchen_status === 'completed');

  return (
    <div className="order-status-board">
      <header className="status-board-header">
        <h1>Order Status</h1>
        <div className="brand-logo">Odoo Cafe</div>
      </header>
      
      <main className="status-columns">
        <section className="status-column preparing">
          <div className="column-header">Preparing</div>
          <div className="order-numbers">
            {preparing.map(o => (
              <div key={o.order_number} className="order-number-item">
                {String(o.order_number).padStart(3, '0')}
              </div>
            ))}
          </div>
        </section>

        <section className="status-column ready">
          <div className="column-header">Ready for Pickup</div>
          <div className="order-numbers">
            {ready.map(o => (
              <div key={o.order_number} className="order-number-item highlight">
                {String(o.order_number).padStart(3, '0')}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="status-board-footer">
        <p>Please have your receipt ready for pickup</p>
      </footer>
    </div>
  );
}
