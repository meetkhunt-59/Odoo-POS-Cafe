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
  const { products = [], categories = [], session, fetchAll, openSession, addToCart, loading } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) fetchAll(token);
  }, [token, fetchAll]);

  const handleOpenSession = () => {
    openSession(token);
  };

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
    <POSLayout>
      {!session && (
         <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="session-overlay">
               <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
               <h2>Virtual Shift Starting!</h2>
               <p>Open a new session to start taking orders for today.</p>
               <button onClick={handleOpenSession} className="open-session-btn">
                 Open Daily Session
               </button>
             </div>
         </div>
      )}
      
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

      <style>{`
          .session-overlay {
            background: white;
            padding: 40px;
            border-radius: 28px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.1);
            max-width: 400px;
            border: 1px solid var(--border);
            animation: slideUp 0.4s ease-out;
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .session-overlay h2 { margin-bottom: 12px; color: var(--text-primary); font-weight: 800; }
          .session-overlay p { margin-bottom: 24px; color: var(--text-secondary); line-height: 1.5; }
          .open-session-btn {
            background: var(--primary);
            color: white;
            width: 100%;
            padding: 14px;
            border-radius: 14px;
            font-weight: 700;
            transition: all 0.2s;
            font-size: 16px;
          }
          .open-session-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
      `}</style>
    </POSLayout>
  );
}
