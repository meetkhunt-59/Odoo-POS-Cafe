import { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { getTransactions } from '../api/client';
import type { TransactionSummary } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { Receipt, Calendar, CreditCard, Loader2 } from 'lucide-react';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const token = useAuthStore(s => s.token);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (token) {
      fetchData(0);
    }
  }, [token]);

  const fetchData = async (currentOffset: number) => {
    try {
      setLoading(true);
      const data = await getTransactions(token!, limit, currentOffset);
      if (currentOffset === 0) {
         setTransactions(data);
      } else {
         setTransactions(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchData(newOffset);
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />
      <main className="pos-dashboard-main">
        <div className="transactions-header">
          <h1 className="header-title">Recent Transactions</h1>
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
          {transactions.length > 0 && transactions.length % limit === 0 && (
             <div className="load-more-container">
               <button className="btn-load-more" onClick={handleLoadMore} disabled={loading}>
                 {loading ? <Loader2 className="spinner" size={16} /> : 'Load More'}
               </button>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
