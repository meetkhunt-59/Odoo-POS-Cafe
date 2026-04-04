import { useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import Dashboard from './reporting/Dashboard';
import { usePosStore } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import './TransactionsPage.css'; // Reusing standard page layout wrappers if needed

export default function ReportingPage() {
  const token = useAuthStore((s) => s.token)!;
  const { products, fetchProducts } = usePosStore();

  useEffect(() => {
    if (token && products.length === 0) {
      fetchProducts(token);
    }
  }, [token, products.length, fetchProducts]);

  return (
    <div className="pos-dashboard-root">
      <DashboardNavbar />
      <main className="pos-dashboard-main" style={{ padding: 0 }}>
        {/* We reuse the analytics dashboard component */}
        <Dashboard products={products} />
      </main>
    </div>
  );
}
