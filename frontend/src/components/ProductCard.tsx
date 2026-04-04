import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Product } from '../api/mockData';
import './Product.css';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  const [qty, setQty] = useState(0);

  const handleAdd = () => {
    setQty(1);
    onAdd(product);
  };

  const handleIncrement = () => setQty(q => q + 1);
  const handleDecrement = () => setQty(q => Math.max(0, q - 1));

  return (
    <div className={`product-card ${qty > 0 ? 'selected' : ''}`}>
      <div className="img-zone">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.discount && (
          <div className="discount-badge">{product.discount}</div>
        )}
      </div>
      
      <div className="info-zone">
        <h3 className="product-name">{product.name}</h3>
        
        <div className="price-row">
          <span className="price">${product.price.toFixed(2)}</span>
          <div className="diet-badge">
            <span className={`diet-dot ${product.isVeg ? 'veg' : 'non-veg'}`}></span>
            {product.isVeg ? 'Veg' : 'Non Veg'}
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
