import { useState, useEffect } from 'react';
import { Plus, Store, CreditCard, Banknote, Smartphone } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { listPointOfSales, createPointOfSale } from '../api/client';
import { PointOfSale } from '../api/types';
import { useAuthStore } from '../store/authStore';
import './SettingsPage.css';

export default function SettingsPage() {
  const [posList, setPosList] = useState<PointOfSale[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    fetchPos();
  }, [token]);

  const fetchPos = async () => {
    if (!token) return;
    try {
      const resp = await listPointOfSales(token);
      setPosList(resp);
    } catch (err) {
      console.error("Failed to fetch POS", err);
    }
  };

  const handleCreate = async () => {
    if (!token || !newPosName.trim()) return;
    try {
      await createPointOfSale(token, {
        name: newPosName,
        cash_enabled: cashEnabled,
        card_enabled: cardEnabled,
        upi_enabled: upiEnabled,
      });
      setIsCreating(false);
      setNewPosName('');
      setCashEnabled(true);
      setCardEnabled(true);
      setUpiEnabled(true);
      fetchPos();
    } catch (err) {
      console.error(err);
      alert("Failed to create POS");
    }
  };

  return (
    <div className="pos-dashboard-root settings-page">
      <DashboardNavbar />
      <main className="pos-dashboard-main">
        <div className="settings-header">
          <h1 className="header-title">Point of Sale Registers</h1>
          <button className="btn-primary-add" onClick={() => setIsCreating(true)}>
            <Plus size={18} /> New Point of Sale
          </button>
        </div>

        {isCreating && (
          <div className="settings-create-card slide-down">
            <h2 className="create-title">Create New POS Configuration</h2>
            <div className="form-group">
              <label>Register Name</label>
              <input 
                type="text" 
                className="input-field"
                value={newPosName} 
                onChange={e => setNewPosName(e.target.value)} 
                placeholder="e.g. Patio Bar, Drive Thru" 
              />
            </div>
            
            <div className="payment-options-section">
              <label className="section-label">Supported Payment Methods</label>
              <div className="toggle-options">
                <button className={`toggle-btn ${cashEnabled ? 'active' : ''}`} onClick={() => setCashEnabled(!cashEnabled)}>
                  <Banknote size={16}/> Cash
                </button>
                <button className={`toggle-btn ${cardEnabled ? 'active' : ''}`} onClick={() => setCardEnabled(!cardEnabled)}>
                  <CreditCard size={16}/> Card
                </button>
                <button className={`toggle-btn ${upiEnabled ? 'active' : ''}`} onClick={() => setUpiEnabled(!upiEnabled)}>
                  <Smartphone size={16}/> UPI
                </button>
              </div>
            </div>

            <div className="create-actions">
              <button className="btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
              <button className="btn-save" onClick={handleCreate} disabled={!newPosName.trim()}>Save POS</button>
            </div>
          </div>
        )}

        <div className="pos-list-grid">
          {posList.map(pos => (
            <div key={pos.id} className="pos-list-card">
              <div className="pos-icon-wrapper">
                <Store size={24} className="pos-icon" />
              </div>
              <div className="pos-details">
                <h3 className="pos-name">{pos.name}</h3>
                <div className="payment-badges">
                  {pos.cash_enabled && <span className="badge badge-cash"><Banknote size={12}/> Cash</span>}
                  {pos.card_enabled && <span className="badge badge-card"><CreditCard size={12}/> Card</span>}
                  {pos.upi_enabled && <span className="badge badge-upi"><Smartphone size={12}/> UPI</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
