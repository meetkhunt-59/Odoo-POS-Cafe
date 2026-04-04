import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProducts, getPublicCategories, createPublicOrder } from '../api/client';
import type { Product, ProductCategory } from '../api/types';
import './SelfOrderPage.css';

export default function SelfOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<{ id: string, number: number, total: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          getPublicProducts(),
          getPublicCategories()
        ]);
        setProducts(prodRes);
        setCategories(catRes);
      } catch (err) {
        console.error("Failed to load generic menu", err);
      }
    }
    loadData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === id);
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) return prev.filter(i => i.product.id !== id);
      return prev.map(i => i.product.id === id ? { ...i, quantity: nextQty } : i);
    });
  };

  const handlePlaceOrder = async () => {
    if (!token || cart.length === 0) return;
    setIsOrdering(true);
    try {
      const payload = {
        session_id: "00000000-0000-0000-0000-000000000000", // Will be overridden in backend by token
        table_id: null, // Overridden in backend
        customer_id: null,
        items: cart.map(c => ({
          product_id: c.product.id,
          quantity: c.quantity
        }))
      };
      
      const order = await createPublicOrder(token, payload);
      setOrderConfirmed({ id: order.id, number: order.order_number, total: Number(order.total_amount) });
      setCart([]);
    } catch (err: any) {
      alert("Failed to submit order: " + err.message);
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="self-order-success">
        <div className="success-card">
          <h1>✅ Order Sent to Kitchen!</h1>
          <p className="order-number">Order #{orderConfirmed.number}</p>
          
          <div className="invoice-summary">
            <div className="row">
               <span>Total Due</span>
               <span className="amt">₹{orderConfirmed.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="instructions">
            Please proceed to the cashier area to process your payment. Let your waiter know if you need anything else!
          </div>

          <button onClick={() => setOrderConfirmed(null)} className="btn-new-order">
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  const subTotal = cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);

  const displayProducts = activeCategory 
    ? products.filter(p => p.category === categories.find(c => c.name === activeCategory)?.id)
    : products;

  return (
    <div className="self-order-container">
      <header className="self-order-header">
        <div className="brand-title">Self Ordering</div>
        <div className="brand-subtitle">Powered by odoo</div>
      </header>

      <div className="categories-scroll">
        <button 
          className={`cat-chip ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categories.map(c => (
          <button 
            key={c.id} 
            className={`cat-chip ${activeCategory === c.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <main className="menu-grid">
        {displayProducts.map(p => (
           <div key={p.id} className="menu-card" onClick={() => addToCart(p)}>
             <div className="info">
               <h3>{p.name}</h3>
               <span className="price">₹{Number(p.price).toFixed(2)}</span>
             </div>
             <button className="add-btn">+</button>
           </div>
        ))}
      </main>

      {cart.length > 0 && (
        <div className="cart-drawer slide-up">
          <div className="cart-header">
             <h2>Your Order</h2>
             <span className="cart-total">₹{subTotal.toFixed(2)}</span>
          </div>
          
          <div className="cart-items">
             {cart.map(item => (
                <div key={item.product.id} className="cart-row">
                   <div className="item-details">
                      <span className="name">{item.product.name}</span>
                      <span className="price">₹{(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                   </div>
                   <div className="qty-controls">
                      <button onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                   </div>
                </div>
             ))}
          </div>

          <button 
             className="submit-order-btn" 
             disabled={isOrdering} 
             onClick={handlePlaceOrder}
          >
             {isOrdering ? 'Sending to Kitchen...' : `Confirm Order (₹${subTotal.toFixed(2)})`}
          </button>
        </div>
      )}
    </div>
  );
}
