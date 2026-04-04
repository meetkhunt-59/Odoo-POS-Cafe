import { useEffect, useState } from 'react';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import { ChevronRight, Coffee, Layers, User } from 'lucide-react';
import './FloorSelectionPage.css';
import { useNavigate } from 'react-router-dom';

export default function FloorSelectionPage() {
  const token = useAuthStore((s) => s.token)!;
  const { floors, tables, fetchAll, selectTable, selectedTableId } = usePosStore();
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchAll(token);
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
      <div className="floor-main-content">
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
             floorTables.map(table => (
               <button 
                 key={table.id}
                 className={`table-card ${selectedTableId === table.id ? 'active' : ''} ${!table.is_active ? 'disabled' : ''}`}
                 onClick={() => handleTableClick(table.id)}
                 disabled={!table.is_active}
               >
                 <div className="table-number">{table.table_number}</div>
                 <div className="table-meta">
                   <span>{table.seats} Seats</span>
                   {table.appointment_resource && <span className="reserved-tag">Reserved</span>}
                 </div>
                 {selectedTableId === table.id && <div className="active-indicator">Current</div>}
               </button>
             ))
           )}
        </section>
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
                   <div className="detail-value status-open">Available</div>
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
