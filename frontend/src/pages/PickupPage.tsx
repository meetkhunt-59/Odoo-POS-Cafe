import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import { Loader2, CheckCircle, Clock, Search, RefreshCw } from 'lucide-react';
import TerminalTopNav from '../components/TerminalTopNav';
import './PickupPage.css';

interface PickupOrder {
  id: string;
  order_number: number;
  kitchen_status: string;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
}

export default function PickupPage() {
  const token = useAuthStore((s) => s.token)!;
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReadyOrders = async () => {
    try {
      const res = await api.getKitchenOrders(token);
      // Filter for orders that are 'completed' (Ready for Pickup)
      const readyOrders = (res as any).filter((o: any) => o.kitchen_status === 'completed');
      setOrders(readyOrders);
    } catch (err) {
      console.error('Failed to fetch ready orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
    const interval = setInterval(fetchReadyOrders, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkDelivered = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      await api.updateOrderStatus(token, orderId, 'mark_delivered');
      // Optimistic update
      setOrders(current => current.filter(o => o.id !== orderId));
    } catch (err) {
      alert('Failed to mark as picked up. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toString().includes(searchQuery) ||
    o.order_items.some(i => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pickup-layout-wrapper">
      <TerminalTopNav />
      
      <main className="pickup-main-content">
        <header className="pickup-header">
          <div className="header-title">
            <CheckCircle size={28} className="ready-icon" />
            <h1>Ready for Pickup</h1>
            <span className="count-badge">{orders.length}</span>
          </div>
          
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search ticket # or items..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="refresh-btn" onClick={fetchReadyOrders} title="Sync Now">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {loading && orders.length === 0 ? (
          <div className="pickup-empty-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Syncing Pickup Queue...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="pickup-empty-state">
            <div className="empty-icon">🍱</div>
            <p>{searchQuery ? 'No matching orders.' : 'No orders ready for pickup yet.'}</p>
          </div>
        ) : (
          <div className="pickup-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className="pickup-card">
                <div className="pickup-card-header">
                  <div className="ticket-info">
                    <span className="ticket-label">Ticket</span>
                    <span className="ticket-number">#{order.order_number}</span>
                  </div>
                  <div className="time-info">
                    <Clock size={14} />
                    <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="pickup-card-body">
                  <div className="items-list">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-qty">{item.quantity}x</span>
                        <span className="item-name">{item.product_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pickup-card-footer">
                  <button 
                    className="picked-up-btn"
                    disabled={processingId === order.id}
                    onClick={() => handleMarkDelivered(order.id)}
                  >
                    {processingId === order.id ? <Loader2 className="animate-spin" size={18} /> : 'Hand Over / Picked Up'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
