import { useEffect, useState } from 'react';
import POSLayout from '../layouts/POSLayout';
import CategoryFilterRow from '../components/CategoryFilterRow';
import ProductGrid from '../components/ProductGrid';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import type { Product } from '../api/types';

export default function POSPage() {
  const token = useAuthStore((s) => s.token)!;
  const { products = [], categories = [], session, fetchAll, addToCart, loading } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

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

  let filteredProducts = products || [];
  if (selectedCategoryId !== 'all') {
    const catName = (categories || []).find((c) => c.id === selectedCategoryId)?.name;
    if (catName) {
      filteredProducts = filteredProducts.filter((p) => p.category === catName);
    }
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
