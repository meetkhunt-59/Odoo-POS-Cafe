import { useEffect, useState } from 'react';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, Coffee, Layers, User } from 'lucide-react';
import TerminalTopNav from '../components/TerminalTopNav';
import './FloorSelectionPage.css';
import { useNavigate } from 'react-router-dom';

export default function FloorSelectionPage() {
  const token = useAuthStore((s) => s.token)!;
  const { floors, tables, fetchAll, selectTable, selectedTableId } = usePosStore();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchAll(token);
      const intervalId = setInterval(() => {
         fetchAll(token);
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [token, fetchAll]);

  // Set default floor
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  const floorTables = tables.filter(t => t.floor_id === selectedFloorId);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const handleTableClick = (tableId: string) => {
    selectTable(tableId);
    // Removed auto-navigate
  };

  return (
    <div className="floor-layout-wrapper">
      {/* LEFT PANE: 75% Tables */}
      <div className="floor-main-content" style={{ padding: 0 }}>
        <TerminalTopNav />
        <div style={{ padding: '24px' }}>
          <header className="floor-header">
          <div className="floor-tabs">
            {floors.map(floor => (
              <button 
                key={floor.id}
                className={`floor-tab-btn ${selectedFloorId === floor.id ? 'active' : ''}`}
                onClick={() => setSelectedFloorId(floor.id)}
              >
                <Layers size={18} />
                {floor.name}
              </button>
            ))}
          </div>
        </header>

        <section className="tables-grid">
           {floorTables.length === 0 ? (
             <div className="empty-floor">
               <Coffee size={48} />
               <p>No tables configured for this floor.</p>
             </div>
           ) : (
              floorTables.map(table => {
                const isUnavailable = table.appointment_resource;
                const isActive = selectedTableId === table.id;
                
                return (
                  <button 
                    key={table.id}
                    className={`table-card ${isActive ? 'active' : ''} ${isUnavailable ? 'unavailable' : 'available'}`}
                    onClick={() => handleTableClick(table.id)}
                    disabled={isUnavailable}
                  >
                    <div className="table-number">{table.table_number}</div>
                    <div className="table-meta">
                      <span>{table.seats} Seats</span>
                      <span className="status-label">{isUnavailable ? 'Occupied' : 'Open'}</span>
                    </div>
                    {isActive && <div className="active-indicator">Current</div>}
                  </button>
                );
              })
           )}
        </section>
        </div>
      </div>

      {/* RIGHT PANE: 25% Receipt-like summary */}
      <div className="floor-receipt-panel">
        <div className="receipt-header-info">
          <h2>Order Summary</h2>
          <div className="receipt-table-details">
            {selectedTable ? (
               <>
                 <div className="detail-row">
                   <div className="detail-label">Table</div>
                   <div className="detail-value">{selectedTable.table_number}</div>
                 </div>
                 <div className="detail-row">
                   <div className="detail-label">Seats</div>
                   <div className="detail-value"><User size={14} className="inline-icon"/> {selectedTable.seats}</div>
                 </div>
                 <div className="detail-row">
                   <div className="detail-label">Status</div>
                   <div className="detail-value" style={{ fontWeight: 600, color: '#000000' }}>Available</div>
                 </div>
               </>
            ) : (
               <div className="no-table-selected">
                 <p>Please select a table to begin.</p>
               </div>
            )}
          </div>
        </div>

        <div className="floor-actions-receipt">
           <button 
             className="next-btn"
             disabled={!selectedTableId}
             onClick={() => navigate('/pos')}
           >
             Continue
             <ChevronRight size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}