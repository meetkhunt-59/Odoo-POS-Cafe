import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import { CheckCircle2, Clock, PlayCircle, Loader2 } from 'lucide-react';
import './KitchenPage.css';

interface KitchenOrderItem {
  id: string;
  product_name: string;
  quantity: number;
}

interface KitchenOrder {
  id: string;
  order_number: number;
  kitchen_status: string;
  total_amount: number;
  created_at: string;
  order_items: KitchenOrderItem[];
}

export default function KitchenPage() {
  const token = useAuthStore((s) => s.token)!;
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.getKitchenOrders(token);
      setOrders(res as any);
    } catch (err) {
      console.error('Failed to fetch kitchen orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, action: string) => {
    try {
      const res = await fetch(`http://localhost:8000/terminal/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const stages = [
    { key: 'to_cook', label: 'To Cook', icon: Clock, color: '#F59E0B' },
    { key: 'preparing', label: 'Preparing', icon: PlayCircle, color: '#10B981' },
    { key: 'completed', label: 'Ready', icon: CheckCircle2, color: '#3B82F6' },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="kitchen-layout">
        <Sidebar />
        <main className="kitchen-main">
          <div className="loading-state">
            <Loader2 className="animate-spin" size={48} />
            <p>Fetching kitchen orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="kitchen-layout">
      <Sidebar />
      <main className="kitchen-main">
        <div className="kitchen-header">
          <h1>👩‍🍳 Kitchen Display System</h1>
          <button onClick={fetchOrders} className="refresh-btn">Refresh</button>
        </div>
        
        <div className="kitchen-grid">
          {stages.map(stage => {
            const stageOrders = orders.filter(o => o.kitchen_status === stage.key);
            return (
              <div key={stage.key} className="kitchen-column">
                <div className="column-header" style={{ borderTop: `4px solid ${stage.color}` }}>
                  <stage.icon size={20} color={stage.color} />
                  <h2>{stage.label}</h2>
                  <span className="order-count">{stageOrders.length}</span>
                </div>
                
                <div className="column-content">
                  {stageOrders.length === 0 && (
                    <div className="empty-stage">No orders here</div>
                  )}
                  {stageOrders.map(order => (
                    <div key={order.id} className="kitchen-order-card">
                      <div className="order-card-header">
                        <span className="order-num">#{order.order_number}</span>
                        <span className="order-time">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="order-items">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="item-row">
                            <span className="item-qty">{item.quantity}x</span>
                            <span className="item-name">{item.product_name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-actions">
                        {stage.key === 'to_cook' && (
                          <button 
                            className="action-btn start-btn" 
                            onClick={() => updateStatus(order.id, 'mark_preparing')}
                          >
                            Start Cooking
                          </button>
                        )}
                        {stage.key === 'preparing' && (
                          <button 
                            className="action-btn complete-btn" 
                            onClick={() => updateStatus(order.id, 'mark_completed')}
                          >
                            Ready to Serve
                          </button>
                        )}
                        {stage.key !== 'completed' && (
                             <button 
                             className="cancel-btn" 
                             onClick={() => updateStatus(order.id, 'mark_cancelled')}
                           >
                             Cancel
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
