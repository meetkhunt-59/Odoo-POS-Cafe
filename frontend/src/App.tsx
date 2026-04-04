import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';
import BackendPage from './pages/BackendPage';
import CustomerPage from './pages/CustomerPage';
import FloorSelectionPage from './pages/FloorSelectionPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage from './pages/PaymentPage';
import SettingsPage from './pages/SettingsPage';

// Auth guard component
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected routes */}
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/pos/tables" element={<RequireAuth><FloorSelectionPage /></RequireAuth>} />
      <Route path="/pos/kitchen" element={<RequireAuth><KitchenPage /></RequireAuth>} />
      <Route path="/admin/backend" element={<RequireAuth><BackendPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/pos/customer-display" element={<RequireAuth><CustomerDisplayPage /></RequireAuth>} />
      <Route path="/pos/payment" element={<RequireAuth><PaymentPage /></RequireAuth>} />
      <Route path="/customer/:orderId" element={<CustomerPage />} />
      <Route path="/pos/*" element={<RequireAuth><POSPage /></RequireAuth>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
