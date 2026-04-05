import { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { getTransactions, deleteOrder } from '../api/client';
import type { TransactionSummary } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { Receipt, Calendar, CreditCard, Trash2 } from 'lucide-react';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const token = useAuthStore(s => s.token);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (token) {
      fetchData(page, dateFilter);
    }
  }, [token, page, dateFilter]);

  const fetchData = async (currentPage: number, dFilter: string) => {
    try {
      setLoading(true);
      const currentOffset = (currentPage - 1) * limit;
      const data = await getTransactions(token!, limit, currentOffset, dFilter || undefined);
      setTransactions(data);
      setHasMore(data.length === limit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  const handleDelete = async (orderId: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this order? This cannot be undone.")) return;
    
    try {
      await deleteOrder(token, orderId);
      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete order.");
    }
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />
      <main className="pos-dashboard-main">
        <div className="transactions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="header-title" style={{ margin: 0 }}>Recent Transactions</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#6B7280' }}>Date</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => { setDateFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', outline: 'none' }}
            />
            {dateFilter && (
              <button 
                onClick={() => { setDateFilter(''); setPage(1); }}
                style={{ background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="transactions-card slide-down">
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Kitchen Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td><div className="cell-order"><Receipt size={14}/> {t.order_number}</div></td>
                    <td>
                      <div className="cell-date">
                        <Calendar size={14}/> {new Date(t.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="cell-amount">${Number(t.total_amount || 0).toFixed(2)}</td>
                    <td>
                      <div className="cell-payment">
                        <span className={`badge ${(t.payment_status || '').toLowerCase() === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                          {(t.payment_status || 'unpaid').toUpperCase()}
                        </span>
                        {t.payment_method && <span className="method-text"><CreditCard size={12}/> {t.payment_method}</span>}
                      </div>
                    </td>
                    <td>
                        <span className={`badge-status status-${t.kitchen_status || 'unknown'}`}>
                          {(t.kitchen_status || 'unknown').replace('_', ' ')}
                        </span>
                    </td>
                    <td>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleDelete(t.id)} 
                          style={{ color: 'var(--danger-color)', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="empty-table">No transactions found.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-container" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Page {page}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-load-more" 
                onClick={handlePrevPage} 
                disabled={page === 1 || loading}
                style={{ padding: '6px 16px' }}>
                Previous
              </button>
              <button 
                className="btn-load-more" 
                onClick={handleNextPage} 
                disabled={!hasMore || loading}
                style={{ padding: '6px 16px' }}>
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}