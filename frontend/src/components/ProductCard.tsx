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

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent adding another product to cart when clicking minus
    updateCartQuantity(product.id, qty - 1);
  };

  return (
    <div className={`product-card ${qty > 0 ? 'selected' : ''}`} onClick={handleAdd}>
      {qty > 0 && (
        <div className="qty-badge">{qty}</div>
      )}
      <div className="img-zone product-icon-zone">
        <span className="product-emoji">{getCategoryIcon(product.category)}</span>
      </div>

      <div className="info-zone">
        <div className="info-left">
          <h3 className="product-name">{product.name}</h3>
          <span className="price">₹{Number(product.price).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {qty > 0 && (
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