import React from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../api/types';
import './Product.css';

interface Props {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export default function ProductGrid({ products, onAddProduct }: Props) {
  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p>No products found. Add products from the <strong>Product Management</strong> page.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAdd={onAddProduct} />
      ))}
    </div>
  );
}