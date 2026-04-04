import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';
import ProductsPage from './pages/ProductsPage';
import NewProductPage from './pages/NewProductPage';
import FloorsPage from './pages/FloorsPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import CustomerPage from './pages/CustomerPage';
import FloorSelectionPage from './pages/FloorSelectionPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage from './pages/PaymentPage';
import SettingsPage from './pages/SettingsPage';
import TransactionsPage from './pages/TransactionsPage';
import PaymentsHistoryPage from './pages/PaymentsHistoryPage';
import CustomersPage from './pages/CustomersPage';
import NewCustomerPage from './pages/NewCustomerPage';
import SelfOrderPage from './pages/SelfOrderPage';
import ReportingPage from './pages/ReportingPage';

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
      <Route path="/self-order/:token" element={<SelfOrderPage />} />

      {/* Protected routes */}
      <Route path="/" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/admin/reporting" element={<RequireAuth><ReportingPage /></RequireAuth>} />
      <Route path="/pos/tables" element={<RequireAuth><FloorSelectionPage /></RequireAuth>} />
      <Route path="/pos/kitchen" element={<RequireAuth><KitchenPage /></RequireAuth>} />
      <Route path="/admin/products" element={<RequireAuth><ProductsPage /></RequireAuth>} />
      <Route path="/admin/products/new" element={<RequireAuth><NewProductPage /></RequireAuth>} />
      <Route path="/admin/floors" element={<RequireAuth><FloorsPage /></RequireAuth>} />
      <Route path="/admin/payments" element={<RequireAuth><PaymentSettingsPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/transactions" element={<RequireAuth><TransactionsPage /></RequireAuth>} />
      <Route path="/payments-history" element={<RequireAuth><PaymentsHistoryPage /></RequireAuth>} />
      <Route path="/customers" element={<RequireAuth><CustomersPage /></RequireAuth>} />
      <Route path="/customers/new" element={<RequireAuth><NewCustomerPage /></RequireAuth>} />
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