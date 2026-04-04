import { NavLink } from 'react-router-dom';
import './DashboardNavbar.css';

export default function DashboardNavbar() {
  return (
    <nav className="dashboard-navbar">
      <div className="nav-links">
        <NavLink 
          to="/pos/delivery" 
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          Orders & Delivery
        </NavLink>
        <NavLink 
          to="/admin/backend" 
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          Products
        </NavLink>
        <NavLink 
          to="/admin/backend" 
          className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
        >
          Reporting
        </NavLink>
      </div>
    </nav>
  );
}
