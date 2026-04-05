import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import * as api from '../api/client';
import { Loader2, Filter, ArrowLeft, Clock, ChefHat, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'to_cook' | 'preparing' | 'completed'>('to_cook');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isStockMode, setIsStockMode] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await api.getKitchenOrders(token);
      setOrders(res as any);
    } catch (err) {
      console.error('Failed to fetch kitchen orders', err);
    } finally {
      if (!isStockMode) setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      const res = await api.listProducts(token);
      setProducts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStockMode) {
      fetchStock();
    } else {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [isStockMode, token]);

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
      await api.updateOrderStatus(token, orderId, action);
      
      // Silently sync real DB state in background without blocking UI
      fetchOrders();
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
          <button className="nav-btn nav-back-master" onClick={() => navigate(-1)} title="Go Back">
            <ArrowLeft size={18} />
          </button>
          
          <div className="nav-divider"></div>

          <button 
            className={`nav-btn ${activeTab === 'to_cook' ? 'active' : ''}`}
            onClick={() => setActiveTab('to_cook')}
          >
            <Clock size={16} />
            <span>To Cook</span>
            <span className="cart-badge">{orders.filter(o => o.kitchen_status === 'to_cook').length}</span>
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`nav-btn ${activeTab === 'preparing' ? 'active' : ''}`}
            onClick={() => setActiveTab('preparing')}
          >
            <ChefHat size={16} />
            <span>Preparing</span>
            <span className="cart-badge" style={{ backgroundColor: '#F5D19B', color: '#1A1A1A' }}>
              {orders.filter(o => o.kitchen_status === 'preparing').length}
            </span>
          </button>

          <div className="nav-divider"></div>

          <button 
            className={`nav-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={16} />
            <span>Completed</span>
            <span className="cart-badge" style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
              {orders.filter(o => o.kitchen_status === 'completed').length}
            </span>
          </button>
        </div>
        
        <div className="status-group" style={{ display: 'flex', gap: '12px' }}>
          <button 
             className="kitchen-refresh-btn" 
             onClick={fetchOrders}
             style={{ background: 'transparent', color: '#10b981', border: '1px solid #10b981' }}
          >
            Sync Orders
          </button>
          <button 
             className="kitchen-refresh-btn"
             onClick={() => setIsStockMode(!isStockMode)}
             style={{ backgroundColor: isStockMode ? '#334155' : 'transparent', color: isStockMode ? 'white' : '#64748b', border: isStockMode ? 'none' : '1px solid #cbd5e1' }}
          >
            {isStockMode ? 'View Orders' : 'Manage Stock'}
          </button>
        </div>
      </div>

      <div className="kitchen-content-wrapper">
        {/* Left Sidebar Filters */}
        <aside className="kitchen-sidebar">
          <div className="sidebar-header">
            <Filter size={18} />
            <h3>Filters</h3>
            {(selectedProduct || selectedCategory || searchQuery) && (
              <button 
                className="clear-filters-btn"
                onClick={() => { setSelectedProduct(null); setSelectedCategory(null); setSearchQuery(''); }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="filter-scroll-container">
            <div style={{ padding: '0 16px 16px' }}>
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
              />
            </div>

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

        {isStockMode ? (
          <main className="kitchen-main-pane" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Menu Stock Availability</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                   <div style={{ fontWeight: 600, fontSize: '16px', color: p.in_stock ? '#1e293b' : '#94a3b8', textDecoration: p.in_stock ? 'none' : 'line-through' }}>{p.name}</div>
                   <button 
                      onClick={async () => {
                         const newVal = !p.in_stock;
                         setProducts(cur => cur.map(curP => curP.id === p.id ? { ...curP, in_stock: newVal } : curP));
                         await api.updateProduct(token, p.id, { in_stock: newVal });
                      }}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer', background: p.in_stock ? '#fef2f2' : '#f0fdf4', color: p.in_stock ? '#ef4444' : '#16a34a' }}
                   >
                     {p.in_stock ? 'Mark 86 (Out)' : 'Mark Available'}
                   </button>
                </div>
              ))}
            </div>
          </main>
        ) : (
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
                  if (searchQuery.trim()) {
                    const matchesTicketStr = order.order_number.toString().includes(searchQuery.trim());
                    if (!matchesTicketStr) {
                      displayItems = displayItems.filter(i => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
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
                      <div className="kds-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="kds-order-no">#{order.order_number}</span>
                        <button 
                           onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'mark_cancelled'); }}
                           style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                        >
                           Cancel Order
                        </button>
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
        )}
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