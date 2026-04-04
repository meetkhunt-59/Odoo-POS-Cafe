export default function Kitchen() {
  return (
    <div className="page kitchen-page fade-in">
      <header className="page-header justify-between">
        <h1>Kitchen Display System</h1>
        <div className="legend">
          <span className="badge red">To Cook</span>
          <span className="badge yellow">Preparing</span>
          <span className="badge green">Completed</span>
        </div>
      </header>

      <div className="ticket-board">
        {/* Placeholder ticket since the DB sync isn't rigged for real-time in this demo layer yet */}
        <div className="kitchen-ticket">
          <div className="ticket-header">
            <h3>Table 2</h3>
            <span className="badge red">Ticket #0041</span>
          </div>
          <ul className="ticket-items">
            <li><span className="qty-box">2x</span> Classic Burger</li>
            <li><span className="qty-box">1x</span> Fries (Large)</li>
            <li><span className="qty-box">3x</span> Mocha</li>
          </ul>
          <div className="ticket-footer">
            <button className="w-full">Start Preparing</button>
          </div>
        </div>
        
        <div className="kitchen-ticket preparing">
          <div className="ticket-header">
            <h3>Table 1</h3>
            <span className="badge yellow">Ticket #0039</span>
          </div>
          <ul className="ticket-items">
            <li className="strike"><span className="qty-box">1x</span> Latte</li>
            <li><span className="qty-box">1x</span> Club Sandwich</li>
          </ul>
          <div className="ticket-footer">
            <button className="w-full ghost">Mark Completed</button>
          </div>
        </div>
      </div>
    </div>
  );
}
