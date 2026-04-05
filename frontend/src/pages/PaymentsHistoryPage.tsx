import { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { getPaymentSummary } from '../api/client';
import type { PaymentSummary } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { Calendar, CreditCard, Loader2, Banknote, Smartphone } from 'lucide-react';
import './TransactionsPage.css'; // Reusing transaction page CSS for exact matching layout

export default function PaymentsHistoryPage() {
  const token = useAuthStore(s => s.token);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPaymentSummary(token!);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('cash')) return <Banknote size={16} />;
    if (m.includes('upi')) return <Smartphone size={16} />;
    return <CreditCard size={16} />;
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />
      <main className="pos-dashboard-main">
        <div className="transactions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="header-title" style={{ margin: 0 }}>Payment Summary</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#6B7280' }}>Date</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none' }}
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                style={{ background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="transactions-card slide-down">
          {loading ? (
             <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
               <Loader2 className="spinner" size={32} style={{ margin: '0 auto' }} />
               <p style={{ marginTop: '16px' }}>Loading payment records...</p>
             </div>
          ) : (
            <div className="table-responsive">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(dateFilter ? payments.filter(p => p.date === dateFilter) : payments).map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="cell-date">
                          <Calendar size={14}/> {p.date}
                        </div>
                      </td>
                      <td>
                        <div className="cell-payment">
                           <span className="method-text" style={{ fontSize: '14px', fontWeight: '500' }}>
                             {getMethodIcon(p.payment_method)} {p.payment_method}
                           </span>
                        </div>
                      </td>
                      <td className="cell-amount">${Number(p.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(dateFilter ? payments.filter(p => p.date === dateFilter) : payments).length === 0 && !loading && (
                      <tr>
                        <td colSpan={3} className="empty-table">No localized payments recorded on this terminal for the selected criteria.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}