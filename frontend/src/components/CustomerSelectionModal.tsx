import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, X, Loader2 } from 'lucide-react';
import { getCustomers, createCustomer } from '../api/client';
import type { Customer } from '../api/types';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import './CustomerSelectionModal.css';

interface CustomerSelectionModalProps {
  onClose: () => void;
}

export default function CustomerSelectionModal({ onClose }: CustomerSelectionModalProps) {
  const token = useAuthStore(s => s.token)!;
  const { setSelectedCustomer } = usePosStore();
  const [tab, setTab] = useState<'search' | 'create'>('search');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Create state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tab === 'search') {
      const delay = setTimeout(() => {
        fetchCustomers(searchQuery);
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [searchQuery, tab]);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const newC = await createCustomer(token, {
        name: newName,
        phone: newPhone || undefined,
        email: newEmail || undefined
      });
      setSelectedCustomer(newC);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="customer-modal slide-down inline-customer-modal">
        <div className="modal-header">
          <h2>Attach Customer</h2>
          <button className="btn-close" onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="modal-tabs">
          <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>
            Search Existing
          </button>
          <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>
            Add New
          </button>
        </div>

        {tab === 'search' && (
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
                <div className="loader"><Loader2 className="spinner" size={20}/></div>
              ) : customers.length === 0 ? (
                <div className="empty-state">No customers found.</div>
              ) : (
                customers.map(c => (
                  <button key={c.id} className="customer-result-item" onClick={() => handleSelect(c)}>
                    <div className="c-name"><User size={14}/> {c.name}</div>
                    {c.phone && <div className="c-phone"><Phone size={12}/> {c.phone}</div>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'create' && (
          <form className="modal-body create-body" onSubmit={handleCreate}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus placeholder="e.g. John Doe"/>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Optional"/>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Optional"/>
            </div>
            <button type="submit" className="btn-submit full-width" disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="spinner" size={16}/> : 'Save & Attach'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
