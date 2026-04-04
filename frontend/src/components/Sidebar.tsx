import { NavLink, useNavigate } from 'react-router-dom';
import { Layers, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Sidebar.css';

export default function Sidebar() {
  const { profile, logout, isSidebarCollapsed, toggleSidebar } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { icon: Layers, label: 'Product Management', to: '/admin/backend' },
    { icon: Settings, label: 'Settings', to: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get initials from profile name
  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo Zone */}
      <div className="logo-zone">
        <div className="logo-icon" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>🌿</div>
        {!isSidebarCollapsed && <div className="brand-name">Odoo POS Cafe</div>}
      </div>

      {/* Nav Items */}
      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon size={24} className="nav-icon" />
            {!isSidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Zone: Current User */}
      <div className="bottom-zone">
        <div className="user-avatar">
          <div className="avatar-circle">{initials}</div>
          {!isSidebarCollapsed && <span className="user-name">{profile?.name || 'Loading...'}</span>}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}