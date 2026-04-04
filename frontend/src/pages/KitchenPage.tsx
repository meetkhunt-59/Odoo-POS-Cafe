import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import { Loader2, Filter } from 'lucide-react';
import './KitchenPage.css';

interface KitchenOrderItem {
  id: string;
  product_name: string;
  category_name?: string;
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
  
  const [activeTab, setActiveTab] = useState<'to_cook' | 'preparing' | 'completed'>('to_cook');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, action: string) => {
    // ⚡ Optimistic UI Update: Instantly mutate frontend state for zero perceived latency
    const statusMap: Record<string, string> = {
      mark_preparing: 'preparing',
      mark_completed: 'completed',
      mark_cancelled: 'cancelled'
    };
    
    setOrders(current => 
      current.map(o => o.id === orderId ? { ...o, kitchen_status: statusMap[action] } : o)
    );

    try {
      const res = await fetch(`http://localhost:8000/terminal/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      
      // Silently sync real DB state in background without blocking UI
      if (res.ok) {
         fetchOrders();
      } else {
         // Revert on fail
         fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update status', err);
      fetchOrders(); // Revert on fail
    }
  };

  // Filter processing
  const tabOrders = orders.filter(o => o.kitchen_status === activeTab);
  
  const allTabItems = useMemo(() => {
    return tabOrders.flatMap(o => o.order_items);
  }, [tabOrders]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(allTabItems.map(i => i.category_name || 'General'))).sort();
  }, [allTabItems]);

  const uniqueProducts = useMemo(() => {
    return Array.from(new Set(allTabItems.map(i => i.product_name))).sort();
  }, [allTabItems]);

  if (loading && orders.length === 0) {
    return (
      <div className="kitchen-app-root">
        <div className="loading-state">
          <Loader2 className="animate-spin" size={48} />
          <p>Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kitchen-app-root">
      {/* Top Navbar mimicking POS Nav but with Kitchen Stages */}
      <div className="terminal-nav kitchen-specific-nav">
        <div className="nav-group-main">
          <button 
            className={`nav-btn ${activeTab === 'to_cook' ? 'active' : ''}`}
            onClick={() => setActiveTab('to_cook')}
          >
            <span>To Cook</span>
            <span className="cart-badge">{orders.filter(o => o.kitchen_status === 'to_cook').length}</span>
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`nav-btn ${activeTab === 'preparing' ? 'active' : ''}`}
            onClick={() => setActiveTab('preparing')}
          >
            <span>Preparing</span>
            <span className="cart-badge" style={{ backgroundColor: '#10B981' }}>
              {orders.filter(o => o.kitchen_status === 'preparing').length}
            </span>
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`nav-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <span>Completed</span>
            <span className="cart-badge" style={{ backgroundColor: '#3B82F6' }}>
              {orders.filter(o => o.kitchen_status === 'completed').length}
            </span>
          </button>
        </div>
        
        <div className="status-group">
          <button className="kitchen-refresh-btn" onClick={fetchOrders}>
            Sync Orders
          </button>
        </div>
      </div>

      <div className="kitchen-content-wrapper">
        {/* Left Sidebar Filters */}
        <aside className="kitchen-sidebar">
          <div className="sidebar-header">
            <Filter size={18} />
            <h3>Filters</h3>
            {(selectedProduct || selectedCategory) && (
              <button 
                className="clear-filters-btn"
                onClick={() => { setSelectedProduct(null); setSelectedCategory(null); }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="filter-scroll-container">
            <div className="filter-section">
              <h4>Categories</h4>
              <div className="filter-list">
                <button 
                  className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </button>
                {uniqueCategories.map(cat => (
                  <button 
                    key={cat}
                    className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => { setSelectedCategory(cat); setSelectedProduct(null); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Products</h4>
              <div className="filter-list">
                <button 
                  className={`filter-chip ${!selectedProduct ? 'active' : ''}`}
                  onClick={() => setSelectedProduct(null)}
                >
                  All Products
                </button>
                {uniqueProducts.map(prod => (
                  <button 
                    key={prod}
                    className={`filter-chip ${selectedProduct === prod ? 'active' : ''}`}
                    onClick={() => { setSelectedProduct(prod); setSelectedCategory(null); }}
                  >
                    {prod}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Orders Display */}
        <main className="kitchen-main-pane">
          {tabOrders.length === 0 ? (
            <div className="empty-stage-msg">No orders in {activeTab.replace('_', ' ')}.</div>
          ) : (
            <div className="kitchen-orders-grid">
              {tabOrders.map(order => {
                // Filter items based on right-side picks
                let displayItems = order.order_items;
                if (selectedCategory) {
                  displayItems = displayItems.filter(i => (i.category_name || 'General') === selectedCategory);
                }
                if (selectedProduct) {
                  displayItems = displayItems.filter(i => i.product_name === selectedProduct);
                }

                // Hide order entirely if it has no items matching the filter
                if (displayItems.length === 0) return null;

                const handleCardClick = (e: React.MouseEvent) => {
                  // Prevent card click if an item was clicked
                  if ((e.target as HTMLElement).closest('.kds-item-row')) return;
                  
                  if (activeTab === 'to_cook') updateStatus(order.id, 'mark_preparing');
                  else if (activeTab === 'preparing') updateStatus(order.id, 'mark_completed');
                };

                return (
                  <div key={order.id} className="kds-card receipt-style" onClick={handleCardClick}>
                    <div className="kds-card-header">
                      <span className="kds-order-no">#{order.order_number}</span>
                    </div>
                    
                    <div className="kds-card-body">
                      {displayItems.map((item, idx) => (
                        <KitchenItemRow key={idx} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sub-component to legally use hooks per-item
function KitchenItemRow({ item }: { item: KitchenOrderItem }) {
  const [isDone, setIsDone] = useState(false);
  return (
    <div 
      className={`kds-item-row ${isDone ? 'item-done' : ''}`}
      onClick={(e) => {
         e.stopPropagation();
         setIsDone(!isDone);
      }}
    >
      <div className="kds-item-qty">{item.quantity} <span>x</span></div>
      <div className="kds-item-name">{item.product_name}</div>
    </div>
  );
}
