import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import { createCustomer } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import { Loader2, ArrowLeft } from 'lucide-react';
import './NewCustomerPage.css';

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParams = searchParams.get('redirect');
  const token = useAuthStore(s => s.token)!;
  const { setSelectedCustomer } = usePosStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    if (redirectParams) {
      navigate(redirectParams);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
      };
      const newCustomer = await createCustomer(token, payload);
      
      // If we are redirecting back to POS checkout, auto-select them!
      if (redirectParams === '/pos') {
        setSelectedCustomer(newCustomer);
        navigate('/pos');
      } else {
        navigate('/customers');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pos-dashboard-root new-customer-root">
      <DashboardNavbar />
      
      <main className="pos-dashboard-main">
        <div className="new-customer-container slide-down">
          
          <div className="new-customer-header">
            <button className="btn-back" onClick={handleBack}>
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="header-title">Create New Customer</h1>
            <p className="header-subtitle">Record contact information and address for billing and history.</p>
          </div>

          <div className="new-customer-card">
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="new-customer-form">
              
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Customer's full name" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="customer@example.com" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Details</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Apt 4B" />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="New York" />
                  </div>
                  <div className="form-group">
                    <label>State / Province</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="NY" />
                  </div>
                  <div className="form-group full-width">
                    <label>Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="United States" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleBack} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || !formData.name.trim()}>
                  {saving ? <Loader2 className="spinner" size={18} /> : 'Save Profile'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}