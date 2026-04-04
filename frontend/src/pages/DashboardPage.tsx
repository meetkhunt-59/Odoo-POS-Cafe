import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store/posStore';
import DashboardNavbar from '../components/DashboardNavbar';
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
    <div className="dashboard-page">
      <DashboardNavbar />
      
      <main className="dashboard-content">
        <h1 className="welcome-title">Click on Open session will open the POS Terminal.</h1>
        
        <div className="cafe-card">
          <div className="cafe-header">
            <h2 className="cafe-name">Odoo Cafe</h2>
            <div className="cafe-options">⋮</div>
          </div>
          
          <div className="cafe-stats">
            <div className="stat-row">
              <span className="stat-label">Last open:</span>
              <span className="stat-value">01/01/2025</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Last Sell:</span>
              <span className="stat-value">$5000</span>
            </div>
          </div>
          
          <button className="open-session-dashboard-btn" onClick={handleOpenSession}>
            Open Session
          </button>
        </div>
      </main>
    </div>
  );
}
