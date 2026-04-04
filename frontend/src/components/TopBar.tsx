import React from 'react';
import { Menu, Search, SlidersHorizontal } from 'lucide-react';
import './TopBar.css';

interface Props {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TopBar({ searchQuery = '', onSearchChange }: Props) {
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
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <button className="filter-btn hover-bg">
        <SlidersHorizontal size={20} />
      </button>
    </div>
  );
}