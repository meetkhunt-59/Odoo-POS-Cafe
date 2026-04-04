import { useEffect, useState } from 'react';
import POSLayout from '../layouts/POSLayout';
import TopBar from '../components/TopBar';
import CategoryFilterRow from '../components/CategoryFilterRow';
import ProductGrid from '../components/ProductGrid';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import type { Product } from '../api/types';

export default function POSPage() {
  const token = useAuthStore((s) => s.token)!;
  const { products = [], categories = [], session, fetchAll, addToCart, loading } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) fetchAll(token);
  }, [token, fetchAll]);


  // Build category list for filter row (prepend "All")
  const filterCategories = [
    { id: 'all', name: 'All', icon: '🍽️', itemCount: Math.max(0, products?.length || 0) },
    ...(categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: '📂',
      itemCount: c.product_count || 0,
    })),
  ];

  // Filter products by category and search
  let filteredProducts = products || [];
  if (selectedCategoryId !== 'all') {
    const catName = (categories || []).find((c) => c.id === selectedCategoryId)?.name;
    if (catName) {
      filteredProducts = filteredProducts.filter((p) => p.category === catName);
    }
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter((p) => (p.name || '').toLowerCase().includes(q));
  }

  const handleAddProduct = (product: Product) => {
    addToCart(product);
  };

  if (loading && !session) {
    return (
      <POSLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Loading POS data...</p>
        </div>
      </POSLayout>
    );
  }

  return (
    <POSLayout showOrderPanel={true}>
      
      <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CategoryFilterRow
        categories={filterCategories}
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
