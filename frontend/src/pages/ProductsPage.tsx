import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import * as api from '../api/client';
import { Package, Plus, Trash2, Edit, Loader2, X, Search } from 'lucide-react';
import './TransactionsPage.css'; // Inheriting styling from existing Dashboard layouts
import './CustomersPage.css'; // Also reusing structural CSS

export default function ProductsPage() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token)!;
  const { products, categories, fetchProducts, fetchCategories } = usePosStore();

  const [search, setSearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([fetchProducts(token), fetchCategories(token)]).finally(() => setLoading(false));
    }
  }, [token]);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(token, id);
      await fetchProducts(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />

      <main className="pos-dashboard-main">
        <div className="transactions-header customers-header-flex">
          <h1 className="header-title">Product Catalog</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-add-customer" style={{ background: 'white', color: '#374151', border: '1px solid #D1D5DB' }} onClick={() => setShowCategoryModal(true)}>
              Manage Categories
            </button>
            <button className="btn-add-customer" onClick={() => navigate('/admin/products/new')}>
              <Plus size={16} /> New Product
            </button>
          </div>
        </div>

        <div className="transactions-card slide-down">
          <div className="search-bar-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="customer-search-input"
            />
          </div>

          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Tax</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="empty-table"><Loader2 className="spinner" size={24} style={{ margin: '0 auto' }} /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="empty-table">No products found.</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-order" style={{ fontWeight: 600, color: '#111827' }}>
                          <Package size={16} style={{ color: '#6B7280' }} /> {p.name} {p.unit ? `(${p.unit})` : ''}
                        </div>
                        {p.variants.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                            {p.variants.length} variant(s) configured
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', background: '#eef2ff', color: '#4f46e5', fontSize: '13px', fontWeight: 500
                        }}>
                          {p.category}
                        </span>
                      </td>
                      <td className="cell-amount">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td>
                        {p.tax ? `${p.tax}%` : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => navigate(`/admin/products/edit/${p.id}`)} 
                            style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#4f46e5' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#EF4444' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Categories Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="customer-modal slide-down" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Product Categories</h2>
              <button className="btn-close" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    defaultValue={c.name}
                    onBlur={async (e) => {
                      if (e.target.value !== c.name) {
                        try {
                          await api.updateCategory(token, c.id, { name: e.target.value });
                          fetchCategories(token);
                        } catch (err) { console.error(err); }
                      }
                    }}
                  />
                  {/* Note: Delete category is not exposed directly here to avoid breaking products, but standard Odoo allows archiving */}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #E5E7EB', margin: '8px 0' }}></div>
              <button
                className="btn-submit"
                onClick={async () => {
                  const name = prompt('New Category Name:');
                  if (name) {
                    await api.createCategory(token, name);
                    fetchCategories(token);
                  }
                }}
              >
                + Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}