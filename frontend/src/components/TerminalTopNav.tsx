import { Coffee, Monitor, ShoppingCart, ListOrdered } from 'lucide-react';
import { usePosStore } from '../store/posStore';
import { useNavigate, useLocation } from 'react-router-dom';
import './TerminalTopNav.css';

export default function TerminalTopNav() {
  const { selectedTableId, tables, cart } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const isFloorView = location.pathname.includes('/pos/tables');
  const isRegisterView = location.pathname === '/pos';
  const isOrderView = location.pathname.includes('/kitchen') || location.pathname.includes('/payment');

  return (
    <div className="terminal-nav">
      <div className="nav-group-main">
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

        <div className="nav-divider"></div>

        <button 
          className={`nav-btn ${isOrderView ? 'active' : ''}`}
          onClick={() => navigate('/pos/kitchen')} // or payment? mapping to order
        >
          <ListOrdered size={20} />
          <span>Order</span>
          {cart && cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
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
