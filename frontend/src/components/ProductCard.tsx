import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Product } from '../api/types';
import { usePosStore } from '../store/posStore';
import './Product.css';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

// Category → emoji mapping for visual flair
const categoryIcons: Record<string, string> = {
  'General': '🍽️',
  'Breakfast': '🍳',
  'Soups': '🥣',
  'Pasta': '🍝',
  'Main Course': '🍛',
  'Burgers': '🍔',
  'Drinks': '🥤',
  'Desserts': '🍰',
  'Starters': '🥗',
  'Pizza': '🍕',
  'Coffee': '☕',
};

function getCategoryIcon(category: string): string {
  return categoryIcons[category] || '📦';
}

export default function ProductCard({ product, onAdd }: Props) {
  const cart = usePosStore((s) => s.cart);
  const updateCartQuantity = usePosStore((s) => s.updateCartQuantity);
  const cartItem = cart.find((item) => item.product.id === product.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    onAdd(product);
  };

  const handleIncrement = () => {
    updateCartQuantity(product.id, qty + 1);
  };

  const handleDecrement = () => {
    updateCartQuantity(product.id, qty - 1);
  };

  return (
    <div className={`product-card ${qty > 0 ? 'selected' : ''}`}>
      <div className="img-zone product-icon-zone">
        <span className="product-emoji">{getCategoryIcon(product.category)}</span>
      </div>

      <div className="info-zone">
        <h3 className="product-name">{product.name}</h3>

        <div className="price-row">
          <span className="price">₹{Number(product.price).toFixed(2)}</span>
          <div className="diet-badge">
            <span className="category-label">{product.category}</span>
          </div>
        </div>

        {qty === 0 ? (
          <button className="add-cta" onClick={handleAdd}>
            Add to Dish
          </button>
        ) : (
          <div className="qty-stepper">
            <button className="icon-btn" onClick={handleDecrement}><Minus size={16} /></button>
            <span className="qty-count">{qty}</span>
            <button className="icon-btn" onClick={handleIncrement}><Plus size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
