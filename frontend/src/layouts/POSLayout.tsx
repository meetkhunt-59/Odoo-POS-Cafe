import React from 'react';
import Sidebar from '../components/Sidebar';
import OrderPanel from '../components/OrderPanel';

interface POSLayoutProps {
  children: React.ReactNode;
}

export default function POSLayout({ children }: POSLayoutProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* 1. SIDEBAR: ~160px, fixed */}
      <Sidebar />

      {/* 2. CONTENT AREA: flex-1, scrollable */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </main>

      {/* 3. ORDER PANEL: ~340px, fixed */}
      <OrderPanel />
    </div>
  );
}
