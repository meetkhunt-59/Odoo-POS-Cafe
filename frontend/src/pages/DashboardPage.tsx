import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import DashboardNavbar from '../components/DashboardNavbar';
import { MoreVertical, Settings, Monitor, MonitorPlay, Plus } from 'lucide-react';
import { listPointOfSales, getPaymentSummary } from '../api/client';
import type { PointOfSale } from '../api/types';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const resetForNewCustomer = usePosStore((s) => s.resetForNewCustomer);

  const [posList, setPosList] = useState<PointOfSale[]>([]);
  const [cashTotal, setCashTotal] = useState<number>(0);

  useEffect(() => {
    if (token) {
      listPointOfSales(token)
        .then(data => setPosList(data))
        .catch(err => console.error("Failed to load POS list:", err));

      getPaymentSummary(token)
        .then(summaries => {
           const today = new Date().toISOString().split('T')[0];
           const todayCash = summaries
             .filter(s => s.date === today && s.payment_method.toLowerCase() === 'cash')
             .reduce((sum, s) => sum + Number(s.total_amount), 0);
           setCashTotal(todayCash);
        })
        .catch(err => console.error("Failed to load payment tracking:", err));
    }
  }, [token]);

  const handleOpenSession = () => {
    // Step 1: Initiation: indicate a new customer has arrived
    resetForNewCustomer();
    // Step 2: Location Selection
    navigate('/pos/tables');
  };

  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setDropdownOpenId(prev => (prev === id ? null : id));
  }

  return (
    <div className="pos-dashboard-root">
      <DashboardNavbar />


      <main className="pos-dashboard-main">
        <div className="pos-grid">

          {posList.length === 0 ? (
            <div className="empty-state-pos" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
              <h3 style={{ color: '#374151', fontSize: '20px', marginBottom: '12px' }}>No Point of Sales configured</h3>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>Get started by configuring your first physical or virtual register.</p>
              <button
                onClick={() => navigate('/settings')}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={16} /> Create Point of Sale
              </button>
            </div>
          ) : (
            posList.map(pos => (
              <div key={pos.id} className="pos-register-card">
                <div className="card-top-accent"></div>
                <div className="card-header">
                  <h2 className="register-name">{pos.name}</h2>
                  <div className="options-dropdown-container">
                    <button className="register-options" onClick={() => toggleDropdown(pos.id)}>
                      <MoreVertical size={20} />
                    </button>

                    {dropdownOpenId === pos.id && (
                      <div className="options-menu-popup">
                        <button className="dropdown-menu-item" onClick={() => navigate('/settings')}>
                          <Settings size={16} /> Settings
                        </button>
                        <button className="dropdown-menu-item" onClick={() => navigate('/pos/kitchen')}>
                          <Monitor size={16} /> Kitchen Display
                        </button>
                        <button className="dropdown-menu-item" onClick={() => {
                          setDropdownOpenId(null);
                          window.open('/pos/customer-display', 'CustomerDisplay', 'width=1024,height=768');
                        }}>
                          <MonitorPlay size={16} /> Customer Display
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-content">
                  <div className="status-row">
                    <div className="status-indicator active"></div>
                    <span className="status-text">Ready to Open</span>
                  </div>

                  <div className="register-stats">
                    <div className="stat-line">
                      <span className="stat-label">Last closing cash</span>
                      <span className="stat-value">₹ {cashTotal.toFixed(2)}</span>
                    </div>
                    <div className="stat-line">
                      <span className="stat-label">Supported</span>
                      <span className="stat-value" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                        {[pos.cash_enabled && 'Cash', pos.card_enabled && 'Card', pos.upi_enabled && 'UPI'].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="btn-open-session" onClick={handleOpenSession}>
                    Open Session
                  </button>
                </div>
              </div>
            ))
          )}



        </div>
      </main>
    </div>
  );
}