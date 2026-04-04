import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Coffee, Calendar, Truck, FileText, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const navItems = [
    { icon: Home, label: 'Menu', to: '/pos' },
    { icon: Coffee, label: 'Table Services', to: '/pos/tables' },
    { icon: Calendar, label: 'Reservation', to: '/pos/reservations' },
    { icon: Truck, label: 'Delivery', to: '/pos/delivery' },
    { icon: FileText, label: 'Accounting', to: '/admin/accounting' },
    { icon: Settings, label: 'Settings', to: '/admin/settings' },
  ];

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

      {/* Bottom Zone: Current User / Waiter */}
      <div className="bottom-zone">
        <div className="user-avatar">
          <div className="avatar-circle">FM</div>
          <span className="user-name">Floyd Miles</span>
        </div>
        <button className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
