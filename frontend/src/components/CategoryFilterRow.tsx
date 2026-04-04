import React from 'react';
import './CategoryFilterRow.css';

export interface CategoryFilter {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

interface Props {
  categories: CategoryFilter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CategoryFilterRow({ categories, selectedId, onSelect }: Props) {
  return (
    <div className="category-scroll-container">
      <div className="category-row">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-card ${selectedId === cat.id ? 'active' : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            <div className="cat-icon">{cat.icon}</div>
            <span className="cat-name">{cat.name}</span>
            <span className="cat-count">{cat.itemCount} Items</span>
          </button>
        ))}
      </div>
    </div>
  );
}
