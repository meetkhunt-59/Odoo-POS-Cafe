import { useState, useEffect } from 'react';
import { Plus, Store, CreditCard, Banknote, Smartphone, Link, QrCode } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { listPointOfSales, createPointOfSale, updatePointOfSale } from '../api/client';
import type { PointOfSale } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import './SettingsPage.css';

export default function SettingsPage() {
  const [posList, setPosList] = useState<PointOfSale[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosName, setEditPosName] = useState('');
  const [selfOrderEnabled, setSelfOrderEnabled] = useState(false);
  const token = useAuthStore(s => s.token);
  const { session, tables, fetchAll } = usePosStore();

  useEffect(() => {
    fetchPos();
    if (token) fetchAll(token);
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

  const handleUpdate = async (pos: PointOfSale) => {
    if (!token || !editPosName.trim()) return;
    try {
      await updatePointOfSale(token, pos.id, {
        name: editPosName,
        cash_enabled: pos.cash_enabled,
        card_enabled: pos.card_enabled,
        upi_enabled: pos.upi_enabled,
      });
      setEditingPosId(null);
      fetchPos();
    } catch (err) {
      console.error(err);
      alert("Failed to update POS");
    }
  };

  const togglePosPayment = async (posId: string, currentPos: PointOfSale, paymentType: 'cash' | 'card' | 'upi') => {
    if (!token) return;
    try {
      const updates = {
        cash_enabled: paymentType === 'cash' ? !currentPos.cash_enabled : currentPos.cash_enabled,
        card_enabled: paymentType === 'card' ? !currentPos.card_enabled : currentPos.card_enabled,
        upi_enabled: paymentType === 'upi' ? !currentPos.upi_enabled : currentPos.upi_enabled,
      };
      
      // Optmistic UI Update
      setPosList(prev => prev.map(p => p.id === posId ? { ...p, ...updates } : p));

      await updatePointOfSale(token, posId, updates);
    } catch (err) {
      console.error("Failed to update POS payment methods", err);
      fetchPos(); // Revert on failure
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
              
              {editingPosId === pos.id ? (
                <div className="pos-details" style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    value={editPosName} 
                    onChange={e => setEditPosName(e.target.value)} 
                    style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                     <button className={`toggle-btn ${pos.cash_enabled ? 'active' : ''}`} onClick={() => togglePosPayment(pos.id, pos, 'cash')} style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}>Cash</button>
                     <button className={`toggle-btn ${pos.card_enabled ? 'active' : ''}`} onClick={() => togglePosPayment(pos.id, pos, 'card')} style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}>Card</button>
                     <button className={`toggle-btn ${pos.upi_enabled ? 'active' : ''}`} onClick={() => togglePosPayment(pos.id, pos, 'upi')} style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto' }}>UPI</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditingPosId(null)} style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid #cbd5e1', background: 'white', borderRadius: '4px', fontSize: '13px' }}>Cancel</button>
                    <button onClick={() => handleUpdate(pos)} style={{ padding: '6px 12px', cursor: 'pointer', border: 'none', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>Save</button>
                  </div>
                </div>
              ) : (
                <div className="pos-details" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <h3 className="pos-name">{pos.name}</h3>
                    <div className="payment-badges" style={{ display: 'flex', gap: '0.5rem', marginTop: '6px' }}>
                      <span className={`badge badge-cash ${!pos.cash_enabled ? 'opacity-50 grayscale' : ''}`}><Banknote size={12}/> Cash</span>
                      <span className={`badge badge-card ${!pos.card_enabled ? 'opacity-50 grayscale' : ''}`}><CreditCard size={12}/> Card</span>
                      <span className={`badge badge-upi ${!pos.upi_enabled ? 'opacity-50 grayscale' : ''}`}><Smartphone size={12}/> UPI</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingPosId(pos.id); setEditPosName(pos.name); }}
                    style={{ padding: '6px 12px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="self-order-settings" style={{ marginTop: '48px', background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Self-Ordering Kiosk / Mobile Mode</h2>
              <p style={{ color: '#64748b' }}>Generate unique ordering URLs for tables. Guests scan the URL to place orders directly into the kitchen queue without a waiter.</p>
            </div>
            <button 
              className={`toggle-btn ${selfOrderEnabled ? 'active' : ''}`}
              onClick={() => setSelfOrderEnabled(!selfOrderEnabled)}
              style={{ minWidth: '120px', justifyContent: 'center' }}
            >
              {selfOrderEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {selfOrderEnabled && (
            <div className="self-order-tables">
              {!session ? (
                 <div style={{ padding: '16px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', fontWeight: 600 }}>
                   A register session must be opened first to link self-orders. Please open a session in the POS panel.
                 </div>
              ) : tables.length === 0 ? (
                 <div style={{ padding: '16px', background: '#f8fafc', color: '#64748b', borderRadius: '12px' }}>
                   No tables configured. Add tables in Floor Management.
                 </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {tables.map(t => {
                    const payload = btoa(`${session.id}:${t.id}`);
                    const url = `${window.location.origin}/self-order/${payload}`;
                    return (
                      <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '18px', color: '#334155' }}>Table {t.table_number}</div>
                        <input 
                          readOnly 
                          value={url} 
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', width: '100%' }}
                        />
                        <button 
                          onClick={() => window.open(url, '_blank')}
                          style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '8px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
                        >
                          <Link size={16} /> Open Mobile Link
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}