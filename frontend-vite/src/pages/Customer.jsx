import { useParams } from "react-router-dom";

export default function Customer() {
  const { id } = useParams();

  return (
    <div className="customer-display screen-center flex-col fade-in">
      <div className="customer-card">
        <h1 className="brand-title">Odoo POS Cafe</h1>
        <div className="customer-status mt-xl">
          <h2>Order {id || "#0041"}</h2>
          <p className="muted text-lg mt-sm">Status: <strong className="text-unpaid">Awaiting Payment</strong></p>
        </div>
        
        <div className="qr-placeholder mt-xl">
          <div className="qr-box">QR Code Emulation</div>
          <p className="muted mt-md">Scan to pay via UPI</p>
        </div>
      </div>
    </div>
  );
}
