import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import * as api from '../api/client';
import { CreditCard, Plus, Trash2, Loader2, Smartphone, Banknote } from 'lucide-react';
import './TransactionsPage.css';

export default function PaymentSettingsPage() {
  const token = useAuthStore(s => s.token)!;
  const { paymentMethods, fetchPaymentMethods } = usePosStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [upiId, setUpiId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchPaymentMethods(token).finally(() => setLoading(false));
    }
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await api.createPaymentMethod(token, {
        name: name.trim(),
        type: type,
        upi_id: type === 'upi' ? upiId.trim() : undefined
      });
      setName(''); setType('cash'); setUpiId('');
      await fetchPaymentMethods(token);
    } catch(err: any) { alert(err.message); } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this payment method?")) return;
    try {
      await api.deletePaymentMethod(token, id);
      await fetchPaymentMethods(token);
    } catch(err: any) { alert(err.message); }
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />
      
      <main className="pos-dashboard-main">
        <div className="transactions-header customers-header-flex">
          <h1 className="header-title">Payment Methods Integration</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Create Form Sidebar */}
          <div className="transactions-card slide-down" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--primary)' }}/> Add Integration
            </h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563' }}>Method Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Cash Register 1" 
                  style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563' }}>Payment Type *</label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value)}
                  style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white' }}
                >
                  <option value="cash">Cash Tender</option>
                  <option value="digital">Digital / Card Terminal</option>
                  <option value="upi">UPI / QR Transfer</option>
                </select>
              </div>

              {type === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563' }}>Routing UPI ID *</label>
                  <input 
                    type="text" 
                    value={upiId} 
                    onChange={e => setUpiId(e.target.value)} 
                    required 
                    placeholder="e.g. shop@paytm" 
                    style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px' }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>This will be embedded into the receipt QR code.</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={adding || !name.trim()}
                style={{ marginTop: '8px', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              >
                {adding ? <Loader2 className="spinner" size={18} /> : 'Save Payment Terminal'}
              </button>
            </form>
          </div>

          {/* List Main View */}
          <div className="transactions-card slide-down" style={{ padding: '0' }}>
            <div className="table-responsive">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Terminal Label</th>
                    <th>Integration Type</th>
                    <th>Routing Identity</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                     <tr><td colSpan={4} className="empty-table"><Loader2 className="spinner" size={24} style={{ margin: '0 auto' }} /></td></tr>
                  ) : paymentMethods.length === 0 ? (
                    <tr><td colSpan={4} className="empty-table">No payment methods configured.</td></tr>
                  ) : (
                    paymentMethods.map(pm => (
                      <tr key={pm.id}>
                        <td>
                          <div className="cell-order" style={{ fontWeight: 600, color: '#111827' }}>
                            {pm.type === 'cash' ? <Banknote size={16} /> : pm.type === 'upi' ? <Smartphone size={16} /> : <CreditCard size={16} />}
                            {pm.name}
                          </div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500,
                            background: pm.type === 'upi' ? '#ecfdf5' : pm.type === 'digital' ? '#eff6ff' : '#f3f4f6',
                            color: pm.type === 'upi' ? '#059669' : pm.type === 'digital' ? '#2563eb' : '#4b5563'
                          }}>
                            {pm.type.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#6B7280', fontSize: '14px', fontFamily: 'monospace' }}>
                            {pm.upi_id || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDelete(pm.id)} style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#EF4444' }} title="Delete Configuration">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
