import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBag, Box, BarChart2 } from 'lucide-react';
import './DashboardNavbar.css';

export default function DashboardNavbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const handleNavigate = (path: string) => {
    navigate(path);
    setActiveDropdown(null);
  };

  return (
    <nav className="dashboard-terminal-nav" ref={navRef}>
      <div className="nav-group-main">
        
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
              <button onClick={() => handleNavigate('/pos/kitchen')}>Orders</button>
              <button onClick={() => handleNavigate('/pos/payment')}>Payment</button>
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
              <button onClick={() => handleNavigate('/admin/backend')}>Products</button>
              <button onClick={() => handleNavigate('/admin/backend')}>Category</button>
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
              <button onClick={() => handleNavigate('/')}>Dashboard</button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
