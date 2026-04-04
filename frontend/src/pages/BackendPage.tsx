import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import * as api from '../api/client';
import { Plus, Trash2, Package, MapPin, CreditCard, Layers, Edit } from 'lucide-react';
import './BackendPage.css';

type Tab = 'products' | 'floors' | 'payments';

export default function BackendPage() {
  const token = useAuthStore((s) => s.token)!;
  const { products, categories, floors, paymentMethods, fetchAll, fetchProducts, fetchFloors, fetchPaymentMethods, fetchCategories } = usePosStore();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null);

  useEffect(() => {
    fetchAll(token);
  }, [token]);

  // ── Product form ──
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('');
  const [prodTax, setProdTax] = useState('0');
  const [prodDesc, setProdDesc] = useState('');
  const [prodVariants, setProdVariants] = useState<{ attribute: string; value: string; extra_price: number }[]>([]);

  const addVariantRow = () => setProdVariants([...prodVariants, { attribute: '', value: '', extra_price: 0 }]);
  const removeVariantRow = (idx: number) => setProdVariants(prodVariants.filter((_, i) => i !== idx));
  const updateVariantRow = (idx: number, field: string, val: any) => {
    const next = [...prodVariants];
    (next[idx] as any)[field] = val;
    setProdVariants(next);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createProduct(token, {
        name: prodName,
        category: prodCategory || 'General',
        price: parseFloat(prodPrice),
        unit: prodUnit || undefined,
        tax: parseFloat(prodTax) || 0,
        description: prodDesc || undefined,
        variants: prodVariants.length > 0 ? prodVariants : undefined,
      });
      setProdName(''); setProdCategory(''); setProdPrice(''); setProdUnit(''); setProdTax('0'); setProdDesc(''); setProdVariants([]);
      await fetchProducts(token);
      await fetchCategories(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(token, id);
      await fetchProducts(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Floor form ──
  const [floorName, setFloorName] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableSeats, setTableSeats] = useState('2');
  const [tableFloorId, setTableFloorId] = useState('');

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createFloor(token, floorName);
      setFloorName('');
      await fetchFloors(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!tableFloorId) { setError('Select a floor first'); return; }
    try {
      await api.createTable(token, {
        floor_id: tableFloorId,
        table_number: tableName,
        seats: parseInt(tableSeats) || 2,
      });
      setTableName(''); setTableSeats('2');
      await fetchFloors(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFloor = async (id: string) => {
    try {
      await api.deleteFloor(token, id);
      await fetchFloors(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await api.deleteTable(token, id);
      await fetchFloors(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ── Payment form ──
  const [pmName, setPmName] = useState('');
  const [pmType, setPmType] = useState('cash');
  const [pmUpi, setPmUpi] = useState('');

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createPaymentMethod(token, {
        name: pmName,
        type: pmType,
        upi_id: pmType === 'upi' ? pmUpi : undefined,
      });
      setPmName(''); setPmType('cash'); setPmUpi('');
      await fetchPaymentMethods(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await api.deletePaymentMethod(token, id);
      await fetchPaymentMethods(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const { type, data } = editingItem;
      if (type === 'product') {
        await api.updateProduct(token, data.id, data);
        await fetchProducts(token);
      } else if (type === 'floor') {
        await api.updateFloor(token, data.id, data.name);
        await fetchFloors(token);
      } else if (type === 'table') {
        await api.updateTable(token, data.id, data);
        await fetchFloors(token);
      } else if (type === 'payment') {
        await api.updatePaymentMethod(token, data.id, data);
        await fetchPaymentMethods(token);
      }
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const tabs = [
    { key: 'products' as Tab, label: 'Products', icon: Package, count: products.length },
    { key: 'floors' as Tab, label: 'Floors & Tables', icon: MapPin, count: floors.length },
    { key: 'payments' as Tab, label: 'Payment Methods', icon: CreditCard, count: paymentMethods.length },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <main className="backend-main">
        <h1 className="backend-title">
          <Layers size={28} />
          Product Management
        </h1>

        {error && <div className="backend-error">{error}</div>}

        <div className="backend-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`backend-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <t.icon size={18} />
              {t.label}
              <span className="tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="backend-content">
          {/* ════════ PRODUCTS TAB ════════ */}
          {activeTab === 'products' && (
            <div className="backend-section">
              {/* Category Manager */}
              <div className="categories-manager">
                <div className="builder-header">
                  <h3><Layers size={18} /> Manage Categories</h3>
                </div>
                <div className="cat-grid">
                  {categories.map((c) => (
                    <div key={c.id} className="cat-card">
                      <div className="cat-card-main">
                        <input 
                          className="cat-name-input"
                          value={c.name}
                          onBlur={async (e) => {
                            if (e.target.value !== c.name) {
                              await api.updateCategory(token, c.id, { name: e.target.value });
                              await fetchCategories(token);
                            }
                          }}
                        />
                        <div className="cat-toggles">
                          {/* Kitchen toggle removed per requirements */}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="add-cat-btn" onClick={async () => {
                    const name = prompt('New Category Name:');
                    if (name) {
                      await api.createCategory(token, name);
                      await fetchCategories(token);
                    }
                  }}>+ New Category</button>
                </div>
              </div>

              <form className="backend-form" onSubmit={handleCreateProduct}>
                <h3><Plus size={18} /> Add Product</h3>
                <div className="form-row">
                  <input placeholder="Product name *" value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                  <input placeholder="Category" value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} list="cat-list" />
                  <datalist id="cat-list">
                    {categories.map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div className="form-row">
                  <input placeholder="Price *" type="number" step="0.01" min="0.01" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                  <input placeholder="Unit (e.g. kg, pc)" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} />
                  <input placeholder="Tax %" type="number" step="0.01" min="0" value={prodTax} onChange={(e) => setProdTax(e.target.value)} />
                </div>
                <div className="form-row">
                  <textarea placeholder="Product Description" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="form-textarea" />
                </div>

                <div className="variants-builder">
                  <div className="builder-header">
                    <h4>Product Variants</h4>
                    <button type="button" className="add-variant-btn" onClick={addVariantRow}>
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>
                  {prodVariants.map((v, i) => (
                    <div key={i} className="variant-row">
                      <input placeholder="Attr (e.g. Size)" value={v.attribute} onChange={e => updateVariantRow(i, 'attribute', e.target.value)} />
                      <input placeholder="Value (e.g. Large)" value={v.value} onChange={e => updateVariantRow(i, 'value', e.target.value)} />
                      <input placeholder="Extra Price" type="number" step="0.01" value={v.extra_price} onChange={e => updateVariantRow(i, 'extra_price', parseFloat(e.target.value) || 0)} />
                      <button type="button" className="remove-variant-btn" onClick={() => removeVariantRow(i)}>✕</button>
                    </div>
                  ))}
                </div>

                <button type="submit" className="backend-submit">Add Product</button>
              </form>

              <div className="backend-list">
                <h3>Products ({products.length})</h3>
                {products.length === 0 && <p className="empty-msg">No products yet. Add your first!</p>}
                {products.map((p) => (
                  <div key={p.id} className="backend-list-item">
                    <div className="list-item-icon">📦</div>
                    <div className="list-item-info">
                      <span className="list-item-name">
                        {p.name} {p.unit ? `(${p.unit})` : ''}
                      </span>
                      <span className="list-item-meta">
                        {p.category} • ₹{Number(p.price).toFixed(2)} • Tax: {Number(p.tax)}%
                        {p.variants.length > 0 && (
                          <div className="variant-badges">
                            {p.variants.map((v, i) => (
                              <span key={i} className="variant-badge">{v.attribute}: {v.value} (+₹{v.extra_price})</span>
                            ))}
                          </div>
                        )}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button className="edit-btn-small" onClick={() => setEditingItem({ type: 'product', data: { ...p } })}>
                        <Edit size={14} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ FLOORS & TABLES TAB ════════ */}
          {activeTab === 'floors' && (
            <div className="backend-section">
              <form className="backend-form" onSubmit={handleCreateFloor}>
                <h3><Plus size={18} /> Add Floor</h3>
                <div className="form-row">
                  <input placeholder="Floor name (e.g. Ground Floor)" value={floorName} onChange={(e) => setFloorName(e.target.value)} required />
                  <button type="submit" className="backend-submit">Add Floor</button>
                </div>
              </form>

              {floors.length > 0 && (
                <form className="backend-form" onSubmit={handleCreateTable}>
                  <h3><Plus size={18} /> Add Table</h3>
                  <div className="form-row">
                    <select value={tableFloorId} onChange={(e) => setTableFloorId(e.target.value)} required>
                      <option value="">Select Floor</option>
                      {floors.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <input placeholder="Table number (e.g. T1)" value={tableName} onChange={(e) => setTableName(e.target.value)} required />
                    <input placeholder="Seats" type="number" min="1" value={tableSeats} onChange={(e) => setTableSeats(e.target.value)} />
                    <button type="submit" className="backend-submit">Add Table</button>
                  </div>
                </form>
              )}

              <div className="backend-list">
                <h3>Floors & Tables</h3>
                {floors.length === 0 && <p className="empty-msg">No floors yet. Create your first floor!</p>}
                {floors.map((f) => (
                  <div key={f.id} className="floor-group">
                    <div className="backend-list-item floor-header">
                      <div className="list-item-icon">🏢</div>
                      <div className="list-item-info">
                      <span className="list-item-meta">{f.tables.length} table(s)</span>
                      </div>
                      <div className="item-actions">
                        <button className="edit-btn-small" onClick={() => setEditingItem({ type: 'floor', data: { ...f } })}>
                          <Edit size={14} />
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteFloor(f.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {f.tables.map((t) => (
                      <div key={t.id} className="backend-list-item table-item">
                        <div className="list-item-icon">🪑</div>
                        <div className="list-item-info">
                          <span className="list-item-name">Table {t.table_number}</span>
                          <span className="list-item-meta">{t.seats} seats</span>
                        </div>
                        <div className="item-actions">
                          <button className="edit-btn-small" onClick={() => setEditingItem({ type: 'table', data: { ...t } })}>
                            <Edit size={14} />
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteTable(t.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════ PAYMENT METHODS TAB ════════ */}
          {activeTab === 'payments' && (
            <div className="backend-section">
              <form className="backend-form" onSubmit={handleCreatePayment}>
                <h3><Plus size={18} /> Add Payment Method</h3>
                <div className="form-row">
                  <input placeholder="Name (e.g. Cash)" value={pmName} onChange={(e) => setPmName(e.target.value)} required />
                  <select value={pmType} onChange={(e) => setPmType(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="digital">Digital</option>
                    <option value="upi">UPI</option>
                  </select>
                  {pmType === 'upi' && (
                    <input placeholder="UPI ID (e.g. shop@upi)" value={pmUpi} onChange={(e) => setPmUpi(e.target.value)} required />
                  )}
                  <button type="submit" className="backend-submit">Add Method</button>
                </div>
              </form>

              <div className="backend-list">
                <h3>Payment Methods ({paymentMethods.length})</h3>
                {paymentMethods.length === 0 && <p className="empty-msg">No payment methods yet.</p>}
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="backend-list-item">
                    <div className="list-item-icon">
                      {pm.type === 'cash' ? '💵' : pm.type === 'upi' ? '📱' : '💳'}
                    </div>
                    <div className="list-item-info">
                      <span className="list-item-name">{pm.name}</span>
                      <span className="list-item-meta">{pm.type.toUpperCase()}{pm.upi_id ? ` • ${pm.upi_id}` : ''}</span>
                    </div>
                    <div className="item-actions">
                      <button className="edit-btn-small" onClick={() => setEditingItem({ type: 'payment', data: { ...pm } })}>
                        <Edit size={14} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeletePayment(pm.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════════ EDIT MODAL ════════ */}
        {editingItem && (
          <div className="modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h3>Edit {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}</h3>
                <button className="close-btn" onClick={() => setEditingItem(null)}>✕</button>
              </div>
              <form onSubmit={handleUpdateItem}>
                {editingItem.type === 'product' && (
                  <div className="edit-fields">
                    <div className="form-row">
                      <div className="field-group">
                        <label>Name</label>
                        <input value={editingItem.data.name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value }})} />
                      </div>
                      <div className="field-group">
                        <label>Category</label>
                        <input value={editingItem.data.category} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, category: e.target.value }})} list="cat-list" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field-group">
                        <label>Price</label>
                        <input type="number" step="0.01" value={editingItem.data.price} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, price: e.target.value }})} />
                      </div>
                      <div className="field-group">
                        <label>Unit</label>
                        <input value={editingItem.data.unit || ''} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, unit: e.target.value }})} />
                      </div>
                      <div className="field-group">
                        <label>Tax %</label>
                        <input type="number" step="0.01" value={editingItem.data.tax} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, tax: e.target.value }})} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Description</label>
                      <textarea value={editingItem.data.description || ''} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value }})} className="form-textarea" />
                    </div>

                    <div className="variants-builder edit-variants">
                      <div className="builder-header">
                        <label>Variants</label>
                        <button type="button" className="add-variant-btn-small" onClick={() => {
                          const next = [...(editingItem.data.variants || [])];
                          next.push({ attribute: '', value: '', extra_price: 0 });
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, variants: next } });
                        }}>
                          + Add
                        </button>
                      </div>
                      {(editingItem.data.variants || []).map((v: any, i: number) => (
                        <div key={i} className="variant-row-small">
                          <input placeholder="Attribute" value={v.attribute} onChange={e => {
                            const next = [...editingItem.data.variants];
                            next[i].attribute = e.target.value;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, variants: next } });
                          }} />
                          <input placeholder="Value" value={v.value} onChange={e => {
                            const next = [...editingItem.data.variants];
                            next[i].value = e.target.value;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, variants: next } });
                          }} />
                          <input placeholder="Extra" type="number" step="0.01" value={v.extra_price} onChange={e => {
                            const next = [...editingItem.data.variants];
                            next[i].extra_price = parseFloat(e.target.value) || 0;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, variants: next } });
                          }} />
                          <button type="button" className="remove-variant-btn-small" onClick={() => {
                            const next = editingItem.data.variants.filter((_: any, idx: number) => idx !== i);
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, variants: next } });
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {editingItem.type === 'floor' && (
                  <input 
                    placeholder="Floor Name" 
                    value={editingItem.data.name} 
                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value }})}
                  />
                )}
                {editingItem.type === 'table' && (
                  <div className="edit-fields">
                    <input 
                      placeholder="Number" 
                      value={editingItem.data.table_number} 
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, table_number: e.target.value }})}
                    />
                    <input 
                      placeholder="Seats" 
                      type="number"
                      value={editingItem.data.seats} 
                      onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, seats: e.target.value }})}
                    />
                  </div>
                )}
                <button type="submit" className="save-btn">Save Changes</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
