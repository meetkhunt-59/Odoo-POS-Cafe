const Section = ({ title, children, actions }) => (
  <section className="card card-full">
    <header className="card-head">
      <h2>{title}</h2>
      {actions && <div className="actions">{actions}</div>}
    </header>
    <div className="card-body">{children}</div>
  </section>
);

const Pill = ({ text, active, onClick }) => (
  <button className={`pill ${active ? "active" : ""}`} onClick={onClick}>
    {text}
  </button>
);

export default function POS({
  tables,
  activeTable,
  setActiveTable,
  session,
  openSession,
  products,
  addToCart,
  cart,
  bumpQty,
  total,
  paymentMethods,
}) {
  return (
    <div className="page pos-page fade-in">
      <header className="page-header">
        <h1>Point of Sale Terminal</h1>
        {session ? (
          <span className="badge green">Session OP-{(session.id||"").slice(0, 4)} Active</span>
        ) : (
          <button className="primary-btn" onClick={openSession}>+ Open Shift Session</button>
        )}
      </header>

      <div className="grid pos-grid">
        <div className="nav-column stack">
          <Section title="Floor Map">
            <div className="pill-row wrap">
              {tables.map((t) => (
                <Pill key={t.id} text={t.label} active={activeTable === t.id} onClick={() => setActiveTable(t.id)} />
              ))}
            </div>
            {!activeTable && <p className="muted small mt-md">Select a table to assign orders.</p>}
          </Section>

          <Section title="Menu Catalog">
            <div className="product-grid">
              {products.length === 0 && <p className="muted">No products retrieved.</p>}
              {products.map((p) => (
                <div key={p.id} className="product-item" onClick={() => addToCart(p)}>
                  <strong>{p.name}</strong>
                  <span className="muted">₹ {Number(p.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="cart-column">
          <Section title={`Live Order ${activeTable ? "- " + tables.find(t=>t.id===activeTable)?.label : ""}`}>
            <div className="cart-container d-flex flex-col">
              <div className="cart-items flex-grow">
                {cart.length === 0 && <p className="muted p-md">Cart is completely empty. Tap items to add.</p>}
                {cart.map((line) => (
                  <div key={line.id} className="cart-line">
                    <div className="cart-line-info">
                      <strong>{line.name}</strong>
                      <p className="muted small">₹ {line.price.toFixed(2)} unit</p>
                    </div>
                    <div className="qty-controls">
                      <button className="ghost sq" onClick={() => bumpQty(line.id, -1)}>-</button>
                      <span className="qty-num">{line.qty}</span>
                      <button className="ghost sq" onClick={() => bumpQty(line.id, 1)}>+</button>
                    </div>
                    <strong className="cart-line-total">₹ {(line.qty * line.price).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
              
              <div className="cart-footer mt-auto">
                <div className="totals-row">
                  <span>Gross Total</span>
                  <h2>₹ {total.toFixed(2)}</h2>
                </div>
                
                <p className="muted small mb-sm">Select Target Payment Method</p>
                <div className="pill-row wrap mb-md">
                  {paymentMethods.map((pm) => (
                     <span key={pm.id} className="chip">{pm.name}</span>
                  ))}
                </div>

                <button 
                  className="primary-btn w-full" 
                  disabled={!activeTable || cart.length === 0 || !session}
                >
                  Pay & Send to Kitchen
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
