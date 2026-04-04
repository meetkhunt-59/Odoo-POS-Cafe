import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Coffee, Calendar, Truck, Layers, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './Sidebar.css';

export default function Sidebar() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Menu', to: '/pos' },
    { icon: Layers, label: 'Product Management', to: '/admin/backend' },
    { icon: Coffee, label: 'Table Services', to: '/pos/tables' },
    { icon: Calendar, label: 'Reservation', to: '/pos/reservations' },
    { icon: Truck, label: 'Kitchen', to: '/pos/delivery' },
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
    <aside className="sidebar">
      {/* Logo Zone */}
      <div className="logo-zone">
        <div className="logo-icon">🌿</div>
        <div className="brand-name">CHILI POS</div>
      </div>

      {/* Nav Items */}
      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={24} className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Zone: Current User */}
      <div className="bottom-zone">
        <div className="user-avatar">
          <div className="avatar-circle">{initials}</div>
          <span className="user-name">{profile?.name || 'Loading...'}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
