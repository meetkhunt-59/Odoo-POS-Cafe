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
  
  // Aggregate quantity across all variants for the badge
  const qty = cart
    .filter((item) => item.product.id === product.id)
    .reduce((acc, item) => acc + item.quantity, 0);
  
  const hasVariants = product.variants && product.variants.length > 0;

  const handleDecrease = (e: React.MouseEvent) => {
    if (!product.in_stock) return;
    e.stopPropagation();
    
    // For simplicity, decrease the most recently added or first variant if multiple exist
    const items = cart.filter(i => i.product.id === product.id);
    if (items.length > 0) {
      const target = items[items.length - 1];
      updateCartQuantity(product.id, target.variant?.id || null, target.quantity - 1);
    }
  };

  const handleAdd = () => {
    if (!product.in_stock) return;
    onAdd(product);
  };

  return (
    <div className={`product-card ${qty > 0 ? 'selected' : ''} ${!product.in_stock ? 'out-of-stock' : ''}`} onClick={handleAdd} style={{ opacity: product.in_stock ? 1 : 0.5, cursor: product.in_stock ? 'pointer' : 'not-allowed' }}>
      {qty > 0 && (
        <div className="qty-badge">{qty}</div>
      )}
      <div className="img-zone product-icon-zone">
        <span className="product-emoji">{getCategoryIcon(product.category)}</span>
      </div>

      <div className="info-zone">
        <div className="info-left">
          <h3 className="product-name" style={{ textDecoration: product.in_stock ? 'none' : 'line-through' }}>
            {product.name} {!product.in_stock && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800 }}>(86)</span>}
          </h3>
          <span className="price">
            {hasVariants ? (() => {
              const prices = product.variants.map(v => Number(product.price) + Number(v.extra_price));
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return min === max ? `₹${min.toFixed(2)}` : `₹${min.toFixed(2)} – ₹${max.toFixed(2)}`;
            })() : `₹${Number(product.price).toFixed(2)}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {qty > 0 && !hasVariants && (
             <div className="add-btn" style={{ background: '#F3F4F6', color: '#111827', border: '1px solid #D1D5DB' }} onClick={handleDecrease}>
               <span>-</span>
             </div>
          )}
          <div className="add-btn">
            <span>+</span>
          </div>
        </div>
      </div>
    </div>
  );
}