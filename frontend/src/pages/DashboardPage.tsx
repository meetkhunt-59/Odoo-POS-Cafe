import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import DashboardNavbar from '../components/DashboardNavbar';
import { MoreVertical, Settings, Monitor, MonitorPlay } from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const resetForNewCustomer = usePosStore((s) => s.resetForNewCustomer);

  const handleOpenSession = () => {
    // Step 1: Initiation: indicate a new customer has arrived
    resetForNewCustomer();
    // Step 2: Location Selection
    navigate('/pos/tables');
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="pos-dashboard-root">
      <DashboardNavbar />


      <main className="pos-dashboard-main">
        <div className="pos-grid">
          
          {/* Main Register Card */}
          <div className="pos-register-card">
            <div className="card-top-accent"></div>
            <div className="card-header">
              <h2 className="register-name">Odoo Cafe</h2>
              <div className="options-dropdown-container">
                <button className="register-options" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <MoreVertical size={20} />
                </button>
                
                {dropdownOpen && (
                  <div className="options-menu-popup">
                    <button className="dropdown-menu-item" onClick={() => navigate('/backend')}>
                      <Settings size={16} /> Settings
                    </button>
                    <button className="dropdown-menu-item" onClick={() => navigate('/pos/kitchen')}>
                      <Monitor size={16} /> Kitchen Display
                    </button>
                    <button className="dropdown-menu-item" onClick={() => {
                        setDropdownOpen(false);
                        window.open('/pos/customer-display', 'CustomerDisplay', 'width=1024,height=768');
                      }}>
                      <MonitorPlay size={16} /> Customer Display
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card-content">
              <div className="status-row">
                <div className="status-indicator active"></div>
                <span className="status-text">Ready to Open</span>
              </div>
              
              <div className="register-stats">
                <div className="stat-line">
                  <span className="stat-label">Last closing cash</span>
                  <span className="stat-value">$ 1,240.00</span>
                </div>
                <div className="stat-line">
                  <span className="stat-label">Last closing date</span>
                  <span className="stat-value">Today, 08:30 AM</span>
                </div>
              </div>
            </div>
            
            <div className="card-footer">
              <button className="btn-open-session" onClick={handleOpenSession}>
                Open Session
              </button>
            </div>
          </div>

          {/* Second Dummy Card to complete the Dashboard Look */}
          <div className="pos-register-card inactive">
             <div className="card-top-accent inactive-accent"></div>
            <div className="card-header">
              <h2 className="register-name">Patio Bar</h2>
              <button className="register-options"><MoreVertical size={20} /></button>
            </div>
            
            <div className="card-content">
              <div className="status-row">
                <div className="status-indicator"></div>
                <span className="status-text">Closed</span>
              </div>
              
              <div className="register-stats">
                <div className="stat-line">
                  <span className="stat-label">Last closing cash</span>
                  <span className="stat-value">$ 450.00</span>
                </div>
                <div className="stat-line">
                  <span className="stat-label">Last closing date</span>
                  <span className="stat-value">Yesterday, 11:00 PM</span>
                </div>
              </div>
            </div>
            
            <div className="card-footer">
               <button className="btn-open-session secondary">
                New Session
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
