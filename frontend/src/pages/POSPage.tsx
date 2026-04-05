import { useEffect, useState } from 'react';
import CategoryFilterRow from '../components/CategoryFilterRow';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import TerminalTopNav from '../components/TerminalTopNav';
import VariantSelectionModal from '../components/VariantSelectionModal';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import type { Product } from '../api/types';
import './FloorSelectionPage.css';

export default function POSPage() {
  const token = useAuthStore((s) => s.token)!;
  const { products = [], categories = [], session, fetchAll, addToCart, loading } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  useEffect(() => {
    if (token) fetchAll(token);
  }, [token, fetchAll]);


  // Build category list for filter row (prepend "All")
  const filterCategories = [
    { id: 'all', name: 'All', icon: '', itemCount: Math.max(0, products?.length || 0) },
    ...(categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: '',
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

  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  const handleAddProduct = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
    } else {
      addToCart(product);
    }
  };

  if (loading && !session) {
    return (
      <div className="floor-layout-wrapper">
        <div className="floor-main-content" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Loading POS data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="floor-layout-wrapper">
      {/* LEFT PANE: 75% Products (reuses floor wrapper) */}
      <div className="floor-main-content" style={{ padding: 0 }}>
        <TerminalTopNav />
        <div style={{ padding: '16px 24px 0 24px' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', outline: 'none' }}
          />
        </div>
        <CategoryFilterRow
          categories={filterCategories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
        <ProductGrid
          products={filteredProducts}
          onAddProduct={handleAddProduct}
        />
      </div>

      {/* RIGHT PANE: 25% OrderPanel (Receipt) */}
      <OrderPanel />

      {selectedProductForVariant && (
        <VariantSelectionModal 
          product={selectedProductForVariant}
          onSelect={(variant) => addToCart(selectedProductForVariant, variant)}
          onClose={() => setSelectedProductForVariant(null)}
        />
      )}
    </div>
  );
}