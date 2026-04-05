import { X } from 'lucide-react';
import type { Product, ProductVariant } from '../api/types';
import './VariantSelectionModal.css';

interface Props {
  product: Product;
  onSelect: (variant: ProductVariant) => void;
  onClose: () => void;
}

export default function VariantSelectionModal({ product, onSelect, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="variant-modal bounce-in" onClick={e => e.stopPropagation()}>
        <div className="variant-modal-header">
          <div>
            <h3>Select Option</h3>
            <p>{product.name}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="variant-list">
          {product.variants.map(v => (
            <button 
              key={v.id} 
              className="variant-option-btn" 
              onClick={() => {
                onSelect(v);
                onClose();
              }}
            >
              <div className="variant-info">
                <span className="variant-name">{v.attribute}: {v.value}</span>
                {v.extra_price > 0 && (
                  <span className="variant-extra">+{Number(v.extra_price).toFixed(2)}</span>
                )}
              </div>
              <div className="variant-price">
                ₹{(Number(product.price) + Number(v.extra_price)).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
