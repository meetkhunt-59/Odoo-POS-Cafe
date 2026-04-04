import React from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../api/mockData';
import './Product.css';

interface Props {
  products: Product[];
  onAddProduct: (product: Product) => void;
}

export default function ProductGrid({ products, onAddProduct }: Props) {
  return (
    <div className="product-grid">
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAdd={onAddProduct} />
      ))}
    </div>
  );
}
