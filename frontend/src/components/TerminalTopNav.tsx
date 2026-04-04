import { Coffee, Monitor } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { useNavigate, useLocation } from 'react-router-dom';
import './TerminalTopNav.css';

export default function TerminalTopNav() {
  const { selectedTableId, tables } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const isFloorView = location.pathname === '/pos/tables';

  return (
    <div className="terminal-nav">
      <div className="nav-group">
        <button 
          className={`nav-btn ${isFloorView ? 'active' : ''}`}
          onClick={() => navigate('/pos/tables')}
        >
          <Coffee size={24} />
          <span>Tables</span>
        </button>
      </div>

      <div className="status-group">
        {selectedTable && (
          <div className="active-item-badge">
            <span className="dot"></span>
            Table {selectedTable.table_number}
          </div>
        )}
        <button 
          className="nav-btn"
          onClick={() => window.open('/pos/customer-display', 'CustomerDisplay', 'width=1024,height=768')}
        >
          <Monitor size={24} />
          <span>Display</span>
        </button>
      </div>
    </div>
  );
}
