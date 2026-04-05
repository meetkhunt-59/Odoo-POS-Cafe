import { Coffee, Monitor, ShoppingCart, ArrowLeft, Package, Receipt, ChefHat } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { useNavigate, useLocation } from 'react-router-dom';
import './TerminalTopNav.css';

export default function TerminalTopNav() {
  const { selectedTableId, tables } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const isFloorView = location.pathname.includes('/pos/tables');
  const isRegisterView = location.pathname === '/pos';
  const isKitchenView = location.pathname.includes('/pos/kitchen');
  const isPickupView = location.pathname.includes('/pos/pickups');
  const isHistoryView = location.pathname.includes('/transactions');

  return (
    <div className="terminal-nav">
      <div className="nav-group-main">
        <button className="nav-btn nav-back-master" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft size={18} />
        </button>

        <div className="nav-divider"></div>

        <button 
          className={`nav-btn ${isFloorView ? 'active' : ''}`}
          onClick={() => navigate('/pos/tables')}
        >
          <Coffee size={20} />
          <span>Table</span>
        </button>

        <div className="nav-divider"></div>

        <button 
          className={`nav-btn ${isRegisterView ? 'active' : ''}`}
          onClick={() => navigate('/pos')}
        >
          <ShoppingCart size={20} />
          <span>Register</span>
        </button>

        {/* <div className="nav-divider"></div>

        <button 
          className={`nav-btn ${isKitchenView ? 'active' : ''}`}
          onClick={() => navigate('/pos/kitchen')}
        >
          <ChefHat size={20} />
          <span>Kitchen</span>
        </button>

        <div className="nav-divider"></div> */}

        <button 
          className={`nav-btn ${isPickupView ? 'active' : ''}`}
          onClick={() => navigate('/pos/pickups')}
        >
          <Package size={20} />
          <span>Pickups</span>
        </button>

        <div className="nav-divider"></div>

        {/* <button 
          className={`nav-btn ${isHistoryView ? 'active' : ''}`}
          onClick={() => navigate('/transactions')}
        >
          <Receipt size={20} />
          <span>History</span>
        </button> */}
      </div>

      <div className="status-group">
        {selectedTable && (
          <div className="active-item-badge">
            <span className="dot"></span>
            Table {selectedTable.table_number}
          </div>
        )}
        <button 
          className="nav-btn-icon"
          title="Customer Display"
          onClick={() => window.open('/pos/customer-display', 'CustomerDisplay', 'width=1024,height=768')}
        >
          <Monitor size={20} />
        </button>
      </div>
    </div>
  );
}