import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pos" replace />} />
      <Route path="/pos/*" element={<POSPage />} />
      <Route path="/pos/delivery" element={<KitchenPage />} /> {/* Placeholder to show another view */}
      <Route path="/admin/*" element={
        <div style={{ padding: 40, textAlign: 'center' }}><h2>Admin Backend Context Placeholder</h2></div>
      } />
    </Routes>
  );
}

export default App;
