import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import DashboardNavbar from '../components/DashboardNavbar';
import { MoreVertical, Settings, Monitor, MonitorPlay, Plus } from 'lucide-react';
import { listPointOfSales, getLastClosingPerPos } from '../api/client';
import type { PointOfSale } from '../api/types';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const resetForNewCustomer = usePosStore((s) => s.resetForNewCustomer);

  const [posList, setPosList] = useState<PointOfSale[]>([]);
  const [closingCashMap, setClosingCashMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (token) {
      listPointOfSales(token)
        .then(data => setPosList(data))
        .catch(err => console.error("Failed to load POS list:", err));

      getLastClosingPerPos(token)
        .then(data => setClosingCashMap(data))
        .catch(err => console.error("Failed to load closing cash:", err));
    }
  }, [token]);

  const handleOpenSession = async (posId: string) => {
    resetForNewCustomer();
    if (token) {
      try {
        await usePosStore.getState().openSession(token, posId);
      } catch (e) {
        console.error("Failed to open session for POS", e);
      }
    }
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
          
          {posList.map(pos => (
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
                    <span className="stat-label">Today's Sales</span>
                    <span className="stat-value">₹ {(closingCashMap[pos.id] ?? 0).toFixed(2)}</span>
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
                <button className="btn-open-session" onClick={() => handleOpenSession(pos.id)}>
                  Open Session
                </button>
              </div>
            </div>
          ))}
          
          {/* Add New POS Card */}
          <div 
            className="pos-register-card add-new-pos-card" 
            onClick={() => navigate('/settings')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: '2px dashed #D1D5DB', minHeight: '260px', boxShadow: 'none' }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Plus size={32} color="var(--primary)" />
            </div>
            <h3 style={{ color: '#374151', fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>New Point of Sale</h3>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: '0' }}>Configure a new register</p>
          </div>

        </div>
      </main>
    </div>
  );
}