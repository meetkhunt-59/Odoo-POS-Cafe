import React from 'react';
import Sidebar from '../components/Sidebar';

export default function KitchenPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', backgroundColor: 'var(--bg-app)', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px' }}>Kitchen Display Server</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {['To Cook', 'Preparing', 'Completed'].map(stage => (
            <div key={stage} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow)', minHeight: '600px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>{stage}</h2>
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active orders
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
