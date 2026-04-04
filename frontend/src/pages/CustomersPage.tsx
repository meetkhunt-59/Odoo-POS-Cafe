import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { getCustomers, createCustomer } from '../api/client';
import type { Customer } from '../api/types';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, User, Phone, Mail, Loader2, X } from 'lucide-react';
import './TransactionsPage.css';
import './CustomersPage.css';

export default function CustomersPage() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (token) {
      // Debounce search slightly
      const delayId = setTimeout(() => {
        setOffset(0); // Reset pagination on new search
        fetchData(0, search, true);
      }, 300);
      return () => clearTimeout(delayId);
    }
  }, [token, search]);

  const fetchData = async (currentOffset: number, query: string, isReset: boolean = false) => {
    try {
      if (isReset) setLoading(true);
      const data = await getCustomers(token!, query, limit, currentOffset);
      if (isReset) {
        setCustomers(data);
      } else {
        setCustomers(prev => [...prev, ...data]);
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
    fetchData(newOffset, search);
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />
      <main className="pos-dashboard-main">
        <div className="transactions-header customers-header-flex">
          <h1 className="header-title">Customer Directory</h1>
          <button className="btn-add-customer" onClick={() => navigate('/customers/new')}>
            <Plus size={16} /> New Customer
          </button>
        </div>
        
        <div className="transactions-card slide-down">
          
          <div className="search-bar-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="customer-search-input"
            />
          </div>

          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Customer Form</th>
                  <th>Contact Information</th>
                  <th>Total Lifetime Sales</th>
                </tr>
              </thead>
              <tbody>
                {loading && offset === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-table">
                      <Loader2 className="spinner" size={24} style={{ margin: '0 auto' }} />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-table">No customers found.</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-order" style={{ fontWeight: 600, color: '#111827' }}>
                          <User size={16} style={{ color: '#6B7280' }}/> {c.name}
                        </div>
                      </td>
                      <td>
                        <div className="customer-contact-stack">
                          {c.phone ? (
                            <span className="contact-line"><Phone size={12}/> {c.phone}</span>
                          ) : null}
                          {c.email ? (
                            <span className="contact-line"><Mail size={12}/> {c.email}</span>
                          ) : null}
                          {!c.phone && !c.email && <span style={{ color: '#9CA3AF', fontSize: '13px' }}>No contact info</span>}
                        </div>
                      </td>
                      <td className="cell-amount">
                        ${Number(c.total_sales || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {customers.length > 0 && customers.length % limit === 0 && !loading && (
             <div className="load-more-container">
               <button className="btn-load-more" onClick={handleLoadMore}>
                 Load More
               </button>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
