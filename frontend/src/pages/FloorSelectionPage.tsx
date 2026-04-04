import { useEffect, useState } from 'react';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import POSLayout from '../layouts/POSLayout';
import { ChevronRight, Coffee, Layers } from 'lucide-react';
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

  const handleTableClick = (tableId: string) => {
    selectTable(tableId);
    navigate('/pos'); // Go to Register after selection
  };

  return (
    <POSLayout>
      <div className="floor-selection-container">
        <header className="floor-header">
          <div className="header-info">
            <h1>Table Service</h1>
            <p>Select a table to start an order</p>
          </div>
          
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

        <div className="floor-actions">
           <button 
             className="next-btn"
             disabled={!selectedTableId}
             onClick={() => navigate('/pos')}
           >
             Continue to Register
             <ChevronRight size={20} />
           </button>
        </div>
      </div>
    </POSLayout>
  );
}
