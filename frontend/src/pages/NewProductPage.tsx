import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import * as api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import './NewCustomerPage.css'; // Inheriting structural CSS

export default function NewProductPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const token = useAuthStore(s => s.token)!;
  const { products, categories, fetchProducts, fetchCategories } = usePosStore();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit: '',
    tax: '',
    description: ''
  });
  
  const [variants, setVariants] = useState<{ attribute: string; value: string; extra_price: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      if (categories.length === 0) fetchCategories(token);
      
      if (isEdit) {
        // If editing, find product from global store or fetch if needed
        const existing = products.find(p => p.id === id);
        if (existing) {
          setFormData({
            name: existing.name,
            category: existing.category,
            price: existing.price.toString(),
            unit: existing.unit || '',
            tax: existing.tax.toString(),
            description: existing.description || ''
          });
          setVariants(existing.variants.map(v => ({
            attribute: v.attribute,
            value: v.value,
            extra_price: v.extra_price.toString()
          })));
        } else {
           // If not in store, fetch list (simplest for now without single-fetch API)
           fetchProducts(token);
        }
      }
    }
  }, [token, categories.length, isEdit, id, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addVariantRow = () => setVariants([...variants, { attribute: '', value: '', extra_price: '' }]);
  const removeVariantRow = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
  const updateVariantRow = (idx: number, field: string, val: string) => {
    const next = [...variants];
    (next[idx] as any)[field] = val;
    setVariants(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;
    
    setSaving(true);
    setError(null);
    try {
      const catVal = formData.category.trim() || 'General';
      const existingCategory = categories.find(c => c.name.toLowerCase() === catVal.toLowerCase());
      
      const payload = {
        name: formData.name.trim(),
        category: catVal,
        price: parseFloat(formData.price),
        unit: formData.unit.trim() || undefined,
        tax: parseFloat(formData.tax) || undefined,
        description: formData.description.trim() || undefined,
        variants: variants.filter(v => v.attribute && v.value).map(v => ({
          attribute: v.attribute,
          value: v.value,
          extra_price: parseFloat(v.extra_price) || 0
        }))
      };

      if (isEdit) {
        await api.updateProduct(token, id!, payload);
      } else {
        await api.createProduct(token, payload);
      }
      
      if (!existingCategory) {
        await fetchCategories(token);
      }
      
      await fetchProducts(token);
      navigate('/admin/products');
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isEdit ? 'Failed to update product' : 'Failed to create product'));
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
            <button className="btn-back" onClick={() => navigate('/admin/products')}>
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="header-title">{isEdit ? 'Edit Product' : 'Create New Product'}</h1>
            <p className="header-subtitle">{isEdit ? 'Update product pricing, details, or variants.' : 'Add a new item to your POS catalog.'}</p>
          </div>

          <div className="new-customer-card">
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="new-customer-form">
              
              <div className="form-section">
                <h3>General Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Product Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Bacon Cheeseburger" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Burgers" list="cat-suggestions" />
                    <datalist id="cat-suggestions">
                      {categories.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. kg, glass, piece" />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      rows={3} 
                      style={{ padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      placeholder="Optional description" 
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing & Tax</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Base Price ($) *</label>
                    <input type="number" step="0.01" min="0" name="price" value={formData.price} onChange={handleChange} required placeholder="12.99" />
                  </div>
                  <div className="form-group">
                    <label>Tax Target (%)</label>
                    <input type="number" step="0.01" min="0" name="tax" value={formData.tax} onChange={handleChange} placeholder="Optional, e.g. 8.5" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>
                  <h3 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>Product Variants</h3>
                  <button type="button" onClick={addVariantRow} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <Plus size={14} /> Add Variant
                  </button>
                </div>
                
                {variants.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#6B7280' }}>No variants added yet. E.g., Size: Medium.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {variants.map((v, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#6B7280' }}>Attribute</label>
                          <input required placeholder="e.g. Size" value={v.attribute} onChange={e => updateVariantRow(i, 'attribute', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#6B7280' }}>Value</label>
                          <input required placeholder="e.g. Large" value={v.value} onChange={e => updateVariantRow(i, 'value', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label style={{ fontSize: '11px', color: '#6B7280' }}>Price Adjust (+/-$)</label>
                          <input type="number" step="0.01" placeholder="0.00" value={v.extra_price} onChange={e => updateVariantRow(i, 'extra_price', e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeVariantRow(i)} style={{ padding: '10px', background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px', color: '#EF4444', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || !formData.name.trim() || !formData.price}>
                  {saving ? <Loader2 className="spinner" size={18} /> : (isEdit ? 'Update Product' : 'Save Product')}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}