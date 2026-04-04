import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import * as api from '../api/client';
import { Plus, Trash2, Loader2, X, Activity, Users, ArrowLeft, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TransactionsPage.css';
import './CustomersPage.css';

export default function FloorsPage() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token)!;
  const { floors, fetchFloors } = usePosStore();
  const [loading, setLoading] = useState(false);

  // Modals state
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [floorNameInput, setFloorNameInput] = useState('');
  const [isSubmittingFloor, setIsSubmittingFloor] = useState(false);

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [activeFloorId, setActiveFloorId] = useState('');
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableSeatsInput, setTableSeatsInput] = useState('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchFloors(token).finally(() => setLoading(false));
    }
  }, [token, fetchFloors]);

  // Auto-generation Logic
  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorNameInput.trim()) return;
    setIsSubmittingFloor(true);

    try {
      const newFloor = await api.createFloor(token, floorNameInput.trim());

      // Auto-generate 5 default premium tables
      const autoTables = [
        { num: 'T1', seats: 2 },
        { num: 'T2', seats: 2 },
        { num: 'T3', seats: 4 },
        { num: 'T4', seats: 4 },
        { num: 'T5', seats: 8 }
      ];

      await Promise.all(
        autoTables.map(t =>
          api.createTable(token, {
            floor_id: newFloor.id,
            table_number: t.num,
            seats: t.seats
          })
        )
      );

      setFloorNameInput('');
      setFloorModalOpen(false);
      await fetchFloors(token);
    } catch (err: any) {
      alert(err.message || 'Error executing floor auto-creation.');
    } finally {
      setIsSubmittingFloor(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim() || !activeFloorId) return;
    setIsSubmittingTable(true);
    try {
      await api.createTable(token, {
        floor_id: activeFloorId,
        table_number: tableNumberInput.trim(),
        seats: parseInt(tableSeatsInput, 10) || 2
      });
      setTableNumberInput('');
      setTableSeatsInput('');
      setTableModalOpen(false);
      await fetchFloors(token);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const handleDeleteFloor = async (id: string, name: string) => {
    if (!window.confirm(`SECURITY WARNING: Are you deliberately trying to delete the entire ${name} floor along with ALL its assigned tables?`)) return;
    try {
      await api.deleteFloor(token, id);
      await fetchFloors(token);
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm("Remove this table from the floor layout?")) return;
    try {
      await api.deleteTable(token, id);
      await fetchFloors(token);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="pos-dashboard-root transactions-page">
      <DashboardNavbar />

      <main className="pos-dashboard-main">
        <div className="transactions-header customers-header-flex">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontWeight: 600, padding: '0 8px 0 0' }}>
                <ArrowLeft size={20} /> Back
              </button>
              <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayersIcon /> Restaurant Architecture
              </h1>
            </div>
            <p style={{ color: '#6B7280', marginTop: '4px', fontSize: '14px', marginLeft: '80px' }}>Map out structural boundaries and optimize table flow for your operational dispatch.</p>
          </div>
          <button className="btn-add-customer" onClick={() => setFloorModalOpen(true)}>
            <Plus size={16} /> Deploy New Floor
          </button>
        </div>

        {/* Floor Architecture Grids */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}><Loader2 className="spinner" size={32} style={{ color: 'var(--primary)', margin: '0 auto' }} /></div>
        ) : floors.length === 0 ? (
          <div className="transactions-card slide-down" style={{ padding: '80px', textAlign: 'center', color: '#6B7280' }}>
            <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3>No Architectural Layout Defined.</h3>
            <p style={{ marginTop: '8px', fontSize: '14px', maxWidth: '400px', margin: '8px auto 0' }}>Deploy your first Floor Level to automatically generate an optimal 5-table routing grid.</p>
          </div>
        ) : (
          floors.map(floor => (
            <div key={floor.id} className="transactions-card slide-down" style={{ marginBottom: '24px', overflow: 'visible', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

              {/* Floor Header Bar */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', background: '#ffffff', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000000' }}></div>
                  {floor.name}
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleDeleteFloor(floor.id, floor.name)} style={{ padding: '6px 12px', color: '#EF4444', background: '#FEF2F2', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={14} /> Demolish
                  </button>
                  <button onClick={() => { setActiveFloorId(floor.id); setTableModalOpen(true); }} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Insert Table
                  </button>
                </div>
              </div>

              {/* Table Map Visualizer */}
              <div style={{ padding: '24px', background: '#F9FAFB', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                {floor.tables.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Structural grid is empty. Plot tables above to begin routing.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {floor.tables.map(table => (
                      <div key={table.id} className="premium-table-card" style={{
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: table.is_active ? '#000000' : '#D1D5DB' }}></div>
                        <div style={{ marginLeft: '4px' }}>
                          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>IDENTIFIER</div>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '20px', letterSpacing: '-0.02em' }}>Table {table.table_number}</div>
                          <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '12px', alignItems: 'center', gap: '6px', backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex' }}>
                            <Users size={12} style={{ color: '#6B7280' }} /> {table.seats}
                          </div>
                          {table.appointment_resource && (
                            <div style={{ fontSize: '11px', color: '#000000', marginTop: '8px', fontWeight: 600, border: '1px solid #000', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>Busy</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await api.updateTable(token!, table.id, { appointment_resource: !table.appointment_resource });
                                fetchFloors(token!);
                              } catch (err) { alert("Failed to toggle table occupancy"); }
                            }}
                            title={table.appointment_resource ? "Mark Available" : "Mark Busy"}
                            style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: table.appointment_resource ? '#000000' : '#ffffff', color: table.appointment_resource ? '#ffffff' : '#000000', borderRadius: '6px', border: '1px solid #000000', display: 'flex', alignItems: 'center' }}
                          >
                            {table.appointment_resource ? "Busy" : "Avail"}
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await api.updateTable(token!, table.id, { is_active: !table.is_active });
                                fetchFloors(token!);
                              } catch (err) { alert("Failed to toggle table"); }
                            }}
                            title={table.is_active ? "Deactivate Layout" : "Activate Layout"}
                            style={{ padding: '6px', cursor: 'pointer', background: table.is_active ? '#000000' : '#ffffff', color: table.is_active ? '#ffffff' : '#000000', borderRadius: '6px', border: '1px solid #000000', display: 'flex' }}
                          >
                            <Power size={14} />
                          </button>
                          <button onClick={() => handleDeleteTable(table.id)} style={{ background: '#F3F4F6', border: 'none', color: '#6B7280', borderRadius: '6px', cursor: 'pointer', padding: '6px', transition: 'color 0.2s' }} title="Remove Structure" className="table-trash-btn">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Creation Modal: Floor Planner */}
      {floorModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="customer-modal slide-down" style={{ maxWidth: '420px', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: '#111827', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Deploy New Layout</h2>
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>System will automate a robust 5-table blueprint.</p>
              </div>
              <button onClick={() => setFloorModalOpen(false)} style={{ background: '#374151', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateFloor} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Floor Blueprint Name *</label>
                <input
                  autoFocus
                  type="text"
                  value={floorNameInput}
                  onChange={e => setFloorNameInput(e.target.value)}
                  placeholder="e.g., Main Hall, VIP Lounge, Terrace"
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  disabled={isSubmittingFloor}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setFloorModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }} disabled={isSubmittingFloor}>Cancel</button>
                <button type="submit" disabled={isSubmittingFloor || !floorNameInput.trim()} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isSubmittingFloor ? <Loader2 size={18} className="spinner" /> : 'Instantiate Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Modal: Individual Table Planner */}
      {tableModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="customer-modal slide-down" style={{ maxWidth: '420px', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Mount Custom Table</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>Manually slot a unique table onto the active grid.</p>
              </div>
              <button onClick={() => setTableModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleCreateTable} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Table Identifier Code *</label>
                  <input
                    autoFocus
                    type="text"
                    value={tableNumberInput}
                    onChange={e => setTableNumberInput(e.target.value)}
                    placeholder="e.g., T6, Balcony-1"
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    disabled={isSubmittingTable}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Optimal Seat Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={tableSeatsInput}
                    onChange={e => setTableSeatsInput(e.target.value)}
                    placeholder="e.g., 6"
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    disabled={isSubmittingTable}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setTableModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }} disabled={isSubmittingTable}>Abort</button>
                <button type="submit" disabled={isSubmittingTable || !tableNumberInput.trim() || !tableSeatsInput} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isSubmittingTable ? <Loader2 size={18} className="spinner" /> : 'Mount Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline custom icon matching Big Corp structural aesthetics
function LayersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 12 12 17 22 12"></polyline>
      <polyline points="2 17 12 22 22 17"></polyline>
    </svg>
  );
}