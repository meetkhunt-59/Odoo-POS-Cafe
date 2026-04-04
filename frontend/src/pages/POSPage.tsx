import React, { useState } from 'react';
import POSLayout from '../layouts/POSLayout';
import TopBar from '../components/TopBar';
import CategoryFilterRow from '../components/CategoryFilterRow';
import ProductGrid from '../components/ProductGrid';
import { mockCategories, mockProducts } from '../api/mockData';
import type { Product } from '../api/mockData';

export default function POSPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  const filteredProducts = selectedCategoryId === 'all' 
    ? mockProducts 
    : mockProducts.filter(p => p.categoryId === selectedCategoryId);

  const handleAddProduct = (product: Product) => {
    console.log('Added via mock POSPage:', product.name);
  };

  return (
    <POSLayout>
      <TopBar />
      <CategoryFilterRow 
        categories={mockCategories} 
        selectedId={selectedCategoryId} 
        onSelect={setSelectedCategoryId} 
      />
      <ProductGrid 
        products={filteredProducts} 
        onAddProduct={handleAddProduct} 
      />
    </POSLayout>
  );
}
