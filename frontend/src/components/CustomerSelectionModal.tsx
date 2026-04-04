import { useState, useEffect } from 'react';
import { Search, User, Phone, X, Loader2 } from 'lucide-react';
import { getCustomers } from '../api/client';
import type { Customer } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import { useNavigate } from 'react-router-dom';
import './CustomerSelectionModal.css';

interface CustomerSelectionModalProps {
  onClose: () => void;
}

export default function CustomerSelectionModal({ onClose }: CustomerSelectionModalProps) {
  const token = useAuthStore(s => s.token)!;
  const { setSelectedCustomer } = usePosStore();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const fetchCustomers = async (query: string) => {
    setLoading(true);
    try {
      const data = await getCustomers(token, query, 10, 0); // small limit for fast inline search
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onClose();
  };

  const handleRouteToCreate = () => {
    onClose();
    navigate('/customers/new?redirect=/pos');
  };

  return (
    <div className="modal-overlay">
      <div className="customer-modal slide-down inline-customer-modal">
        <div className="modal-header">
          <h2>Attach Customer</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body search-body">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="search-results">
            {loading ? (
              <div className="loader"><Loader2 className="spinner" size={20} /></div>
            ) : customers.length === 0 ? (
              <div className="empty-state">No customers found.</div>
            ) : (
              customers.map(c => (
                <button key={c.id} className="customer-result-item" onClick={() => handleSelect(c)}>
                  <div className="c-name"><User size={14} /> {c.name}</div>
                  {c.phone && <div className="c-phone"><Phone size={12} /> {c.phone}</div>}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            className="btn-create-route"
            onClick={handleRouteToCreate}
            style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#eef2ff', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
          >
            + Create New Profile
          </button>
        </div>
      </div>
    </div>
  );
}