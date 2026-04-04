import React from 'react';
import { Menu, Search, SlidersHorizontal } from 'lucide-react';
import './TopBar.css';

export default function TopBar() {
  return (
    <div className="topbar">
      <button className="menu-btn hover-bg">
        <Menu size={24} />
      </button>

      <div className="search-container">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search Product here..." 
          className="search-input"
        />
      </div>

      <button className="filter-btn hover-bg">
        <SlidersHorizontal size={20} />
      </button>
    </div>
  );
}
