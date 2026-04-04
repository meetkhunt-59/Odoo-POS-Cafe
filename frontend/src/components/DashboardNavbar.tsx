import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBag, Box, BarChart2, ArrowLeft, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './DashboardNavbar.css';

export default function DashboardNavbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const currentProfile = useAuthStore(s => s.profile);
  const logout = useAuthStore(s => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setActiveDropdown(null);
  };

  return (
    <nav className="dashboard-terminal-nav" ref={navRef}>
      <div className="nav-group-main">
        
        {/* Global Back Navigation (Hidden on root dashboard) */}
        {location.pathname !== '/' && (
          <button className="nav-btn nav-back-master" onClick={() => navigate(-1)} title="Go Back">
            <ArrowLeft size={18} />
          </button>
        )}
        {location.pathname !== '/' && <div className="nav-divider"></div>}
        
        {/* Orders Menu */}
        <div className="nav-dropdown-container">
          <button 
            className={`nav-btn ${activeDropdown === 'orders' ? 'active' : ''}`}
            onClick={() => toggleDropdown('orders')}
          >
            <ShoppingBag size={18} />
            <span>Orders</span>
            <ChevronDown size={14} className={`chevron ${activeDropdown === 'orders' ? 'up' : ''}`} />
          </button>
          
          {activeDropdown === 'orders' && (
            <div className="dashboard-dropdown-menu">
              <button onClick={() => handleNavigate('/transactions')}>Orders</button>
              <button onClick={() => handleNavigate('/payments-history')}>Payment</button>
              <button onClick={() => handleNavigate('/customers')}>Customers</button>
              <button onClick={() => {
                setActiveDropdown(null);
                window.open('/pos/customer-display', 'CustomerDisplay', 'width=1024,height=768');
              }}>Customer</button>
            </div>
          )}
        </div>

        <div className="nav-divider"></div>

        {/* Products Menu */}
        <div className="nav-dropdown-container">
          <button 
            className={`nav-btn ${activeDropdown === 'products' ? 'active' : ''}`}
            onClick={() => toggleDropdown('products')}
          >
            <Box size={18} />
            <span>Products</span>
            <ChevronDown size={14} className={`chevron ${activeDropdown === 'products' ? 'up' : ''}`} />
          </button>
          
          {activeDropdown === 'products' && (
            <div className="dashboard-dropdown-menu">
              <button onClick={() => handleNavigate('/admin/products')}>Products Directory</button>
            </div>
          )}
        </div>

        <div className="nav-divider"></div>

        {/* Reporting Menu */}
        <div className="nav-dropdown-container">
          <button 
            className={`nav-btn ${activeDropdown === 'reporting' ? 'active' : ''}`}
            onClick={() => toggleDropdown('reporting')}
          >
            <BarChart2 size={18} />
            <span>Reporting</span>
            <ChevronDown size={14} className={`chevron ${activeDropdown === 'reporting' ? 'up' : ''}`} />
          </button>
          
          {activeDropdown === 'reporting' && (
            <div className="dashboard-dropdown-menu">
              <button onClick={() => handleNavigate('/admin/reporting')}>Dashboard</button>
            </div>
          )}
        </div>

        <div className="nav-divider"></div>

        {/* Settings Menu */}
        <div className="nav-dropdown-container">
          <button 
            className={`nav-btn ${activeDropdown === 'settings' ? 'active' : ''}`}
            onClick={() => toggleDropdown('settings')}
          >
            <BarChart2 size={18} />
            <span>Settings</span>
            <ChevronDown size={14} className={`chevron ${activeDropdown === 'settings' ? 'up' : ''}`} />
          </button>
          
          {activeDropdown === 'settings' && (
            <div className="dashboard-dropdown-menu">
              <button onClick={() => handleNavigate('/admin/floors')}>Floors & Tables</button>
              <button onClick={() => handleNavigate('/admin/payments')}>Payment Methods</button>
            </div>
          )}
        </div>

      </div>

      <div className="nav-group-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="nav-btn profile-btn"
          onClick={() => handleNavigate('/settings/profile')}
          title="Profile Settings"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <User size={18} />
          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{currentProfile?.name || 'Profile'}</span>
        </button>

        <div className="nav-divider" style={{ margin: '0 4px' }}></div>

        <button 
          className="nav-btn logout-btn"
          onClick={handleLogout}
          title="Log out"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <LogOut size={18} />
          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Logout</span>
        </button>
      </div>
    </nav>
  );
}