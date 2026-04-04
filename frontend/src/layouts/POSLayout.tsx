import React from 'react';
import Sidebar from '../components/Sidebar';
import OrderPanel from '../components/OrderPanel';
import TerminalTopNav from '../components/TerminalTopNav';

interface POSLayoutProps {
  children: React.ReactNode;
  showOrderPanel?: boolean;
}

export default function POSLayout({ children, showOrderPanel = false }: POSLayoutProps) {
  return (
    <div className="pos-layout">
      {/* 1. SIDEBAR: collapsible, fixed */}
      <Sidebar />

      {/* 2. CONTENT AREA: flex-1, scrollable */}
      <main className="pos-main">
        <TerminalTopNav />
        <section className="pos-content">
          {children}
        </section>
      </main>

      {/* 3. ORDER PANEL: flex-basis based, fixed */}
      {showOrderPanel && <OrderPanel />}
    </div>
  );
}
