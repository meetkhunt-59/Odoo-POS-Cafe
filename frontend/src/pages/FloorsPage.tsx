import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import * as api from '../api/client';
import { Plus, Trash2, Loader2, X, Users, Power, Edit } from 'lucide-react';
import './TransactionsPage.css';
import './CustomersPage.css';

export default function FloorsPage() {
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
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

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
    if (!tableNumberInput.trim()) return;
    setIsSubmittingTable(true);
    try {
      if (editingTableId) {
        await api.updateTable(token, editingTableId, {
          table_number: tableNumberInput.trim(),
          seats: parseInt(tableSeatsInput, 10) || 2
        });
      } else {
        if (!activeFloorId) return;
        await api.createTable(token, {
          floor_id: activeFloorId,
          table_number: tableNumberInput.trim(),
          seats: parseInt(tableSeatsInput, 10) || 2
        });
      }
      setTableNumberInput('');
      setTableSeatsInput('');
      setEditingTableId(null);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className="header-title" style={{ color: '#1A1A1A', fontSize: '24px', letterSpacing: '-0.02em', margin: 0 }}>
              Floors & Tables
            </h1>
          </div>
          <button 
            onClick={() => setFloorModalOpen(true)}
            style={{ 
              background: '#1A1A1A', color: 'white', padding: '10px 16px', borderRadius: '8px', 
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, fontSize: '14px' 
            }}
          >
            <Plus size={16} /> Add Floor
          </button>
        </div>

        {/* Floor Architecture Grids */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px' }}><Loader2 className="spinner" size={32} style={{ color: 'var(--primary)', margin: '0 auto' }} /></div>
        ) : floors.length === 0 ? (
          <div className="transactions-card slide-down" style={{ padding: '80px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px' }}>
            <h3 style={{ color: '#1A1A1A' }}>No Floors Found</h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>Add a floor to set up your tables.</p>
          </div>
        ) : (
          floors.map(floor => (
            <div key={floor.id} className="transactions-card slide-down" style={{ marginBottom: '24px', overflow: 'visible', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

              {/* Floor Header Bar */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                  {floor.name}
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleDeleteFloor(floor.id, floor.name)} style={{ padding: '6px 12px', color: '#1A1A1A', background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                  <button onClick={() => { setActiveFloorId(floor.id); setEditingTableId(null); setTableNumberInput(''); setTableSeatsInput(''); setTableModalOpen(true); }} style={{ padding: '6px 12px', background: '#1A1A1A', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Table
                  </button>
                </div>
              </div>

              {/* Table Map Visualizer */}
              <div style={{ padding: '24px', background: '#F4F2F0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                {floor.tables.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No tables on this floor.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                    {floor.tables.map(table => (
                      <div key={table.id} className="premium-table-card" style={{
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        position: 'relative'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '18px' }}>Table {table.table_number}</div>
                          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', alignItems: 'center', gap: '4px', display: 'inline-flex' }}>
                            <Users size={12} /> {table.seats} Seats
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            {table.appointment_resource && (
                              <span style={{ fontSize: '11px', color: '#1A1A1A', fontWeight: 600, background: '#F5D19B', padding: '2px 6px', borderRadius: '4px' }}>Busy</span>
                            )}
                            {!table.is_active && (
                              <span style={{ fontSize: '11px', color: '#1A1A1A', fontWeight: 600, background: '#E5E7EB', padding: '2px 6px', borderRadius: '4px', marginLeft: table.appointment_resource ? '6px' : '0' }}>Inactive</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await api.updateTable(token!, table.id, { appointment_resource: !table.appointment_resource });
                                fetchFloors(token!);
                              } catch (err) { alert("Failed to toggle table occupancy"); }
                            }}
                            title={table.appointment_resource ? "Mark Available" : "Mark Busy"}
                            style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: table.appointment_resource ? '#1A1A1A' : 'transparent', color: table.appointment_resource ? 'white' : '#1A1A1A', borderRadius: '6px', border: '1px solid #1A1A1A' }}
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
                            title={table.is_active ? "Deactivate Table" : "Activate Table"}
                            style={{ padding: '6px', cursor: 'pointer', background: table.is_active ? '#1A1A1A' : 'transparent', color: table.is_active ? 'white' : '#1A1A1A', borderRadius: '6px', border: '1px solid #1A1A1A', display: 'flex' }}
                          >
                            <Power size={14} />
                          </button>
                          <button onClick={() => { setEditingTableId(table.id); setTableNumberInput(table.table_number); setTableSeatsInput(table.seats.toString()); setTableModalOpen(true); }} style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#1A1A1A', borderRadius: '6px', cursor: 'pointer', padding: '6px' }} title="Edit Table">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteTable(table.id)} style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#1A1A1A', borderRadius: '6px', cursor: 'pointer', padding: '6px' }} title="Remove Table">
                            <Trash2 size={14} />
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

      {floorModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'none' }}>
          <div className="customer-modal slide-down" style={{ maxWidth: '420px', padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <div style={{ background: '#1A1A1A', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Add New Floor</h2>
              </div>
              <button onClick={() => setFloorModalOpen(false)} style={{ background: 'transparent', color: 'white', border: 'none', padding: '0', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateFloor} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>Floor Name *</label>
                <input
                  autoFocus
                  type="text"
                  value={floorNameInput}
                  onChange={e => setFloorNameInput(e.target.value)}
                  placeholder="e.g., Main Hall"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  disabled={isSubmittingFloor}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setFloorModalOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#1A1A1A', border: '1px solid #E5E7EB', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }} disabled={isSubmittingFloor}>Cancel</button>
                <button type="submit" disabled={isSubmittingFloor || !floorNameInput.trim()} style={{ flex: 1, padding: '10px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isSubmittingFloor ? <Loader2 size={16} className="spinner" /> : 'Save Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tableModalOpen && (
        <div className="modal-overlay" style={{ backdropFilter: 'none' }}>
          <div className="customer-modal slide-down" style={{ maxWidth: '420px', padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <div style={{ background: '#1A1A1A', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{editingTableId ? 'Edit Table' : 'Add New Table'}</h2>
              </div>
              <button onClick={() => setTableModalOpen(false)} style={{ background: 'transparent', color: 'white', border: 'none', padding: '0', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTable} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>Table Name / Number *</label>
                  <input
                    autoFocus
                    type="text"
                    value={tableNumberInput}
                    onChange={e => setTableNumberInput(e.target.value)}
                    placeholder="e.g., T6"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    disabled={isSubmittingTable}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A1A' }}>Seats *</label>
                  <input
                    type="number"
                    min="1"
                    value={tableSeatsInput}
                    onChange={e => setTableSeatsInput(e.target.value)}
                    placeholder="e.g., 6"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                    disabled={isSubmittingTable}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setTableModalOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', color: '#1A1A1A', border: '1px solid #E5E7EB', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }} disabled={isSubmittingTable}>Cancel</button>
                <button type="submit" disabled={isSubmittingTable || !tableNumberInput.trim() || !tableSeatsInput} style={{ flex: 1, padding: '10px', background: '#1A1A1A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isSubmittingTable ? <Loader2 size={16} className="spinner" /> : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
