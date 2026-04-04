import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import DashboardNavbar from '../components/DashboardNavbar';
import { MoreVertical, Settings } from 'lucide-react';
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
              <button className="register-options"><MoreVertical size={20} /></button>
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
