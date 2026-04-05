import { useEffect, useState } from 'react';
import { Download, Printer, Loader2, DollarSign, ShoppingBag, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { fetchDashboardStats } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import './Dashboard.css';

interface DashboardProps {
  products: any[];
}

export default function Dashboard({ products }: DashboardProps) {
  const token = useAuthStore((s) => s.token)!;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [period, setPeriod] = useState('today');
  const [employeeId, setEmployeeId] = useState('all');
  const [sessionId, setSessionId] = useState('all');
  const [productId, setProductId] = useState('all');

  useEffect(() => {
    loadStats();

    // Auto-refresh stats every 10 seconds for "live" updates
    const intervalId = setInterval(() => {
      fetchDashboardStats(token, period, employeeId, sessionId, productId).then(data => setStats(data)).catch(console.error);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [period, employeeId, sessionId, productId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats(token, period, employeeId, sessionId, productId);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportXLS = () => {
    if (!stats) return;
    let csv = "Order Number,Date,Items,Total,Status\n";
    (stats.top_orders || []).forEach((o: any) => {
      csv += `"${o.order_number}","${o.date}","${o.items}","${o.total}","${o.status}"\n`;
    });
    
    // Convert to Blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Odoo App Color Palette
  const PIE_COLORS = ['#714B67', '#00A09D', '#374151', '#8E6381', '#10B981'];

  return (
    <div className="backend-section dashboard-section">
      <div className="dashboard-top-bar hide-on-print">    
        <div className="dashboard-filters-row">
          <div className="segment-group">
            <button className={`segment-btn ${period === 'today' ? 'active' : ''}`} onClick={() => setPeriod('today')}>Today</button>
            <button className={`segment-btn ${period === 'last7' ? 'active' : ''}`} onClick={() => setPeriod('last7')}>Last 7 Days</button>
            <button className={`segment-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>This Month</button>
            <button className={`segment-btn ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>All Time</button>
          </div>
          <div className="advanced-filters">
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="all">All Employees</option>
              <option value="admin">Administrator</option>
            </select>
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value="all">All Sessions</option>
              <option value="s1">Session #0012</option>
            </select>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="all">All Products</option>
              {products.slice(0, 10).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="dashboard-actions">
            <button className="odoo-btn-outline" onClick={handleExportPDF}><Printer size={16} /> Print Report</button>
            <button className="odoo-btn-outline odoo-btn-primary" onClick={handleExportXLS}><Download size={16} /> Export CSV</button>
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Loader2 className="lucide-spin" size={48} color="#00A09D" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          {/* Executive Summary */}
          <div className="dashboard-module kpi-row">
            <div className="kpi-card">
               <div className="kpi-icon-wrapper gray">
                 <ShoppingBag size={24} />
               </div>
               <div className="kpi-content">
                  <span className="kpi-title">Total Orders</span>
                  <span className="kpi-value">{stats.kpis?.total_orders || 0}</span>
                  <span className="kpi-desc">Successful transactions</span>
               </div>
            </div>
            <div className="kpi-card">
               <div className="kpi-icon-wrapper teal">
                 <DollarSign size={24} />
               </div>
               <div className="kpi-content">
                  <span className="kpi-title">Net Revenue</span>
                  <span className="kpi-value">₹{Number(stats.kpis?.revenue || 0).toLocaleString()}</span>
                  <span className="kpi-desc">Total sales collected</span>
               </div>
            </div>
            <div className="kpi-card">
               <div className="kpi-icon-wrapper purple">
                 <TrendingUp size={24} />
               </div>
               <div className="kpi-content">
                  <span className="kpi-title">Average Order Value</span>
                  <span className="kpi-value">₹{Number(stats.kpis?.average_order || 0).toFixed(2)}</span>
                  <span className="kpi-desc">Typical spend per ticket</span>
               </div>
            </div>
          </div>

          {/* Sales Trends */}
          <div className="dashboard-module charts-row">
            <div className="chart-box">
              <div className="section-header">
                <h3 className="section-title">Daily Revenue Trend</h3>
                <p className="section-subtitle">Visualizing cash flow trajectory over time.</p>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                {stats.line_chart?.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={stats.line_chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} dx={-10} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="sales" stroke="#00A09D" strokeWidth={3} dot={{ r: 4, fill: '#00A09D', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9CA3AF' }}>No sales data found for the selected period.</div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Intelligence */}
          <div className="dashboard-module intelligence-row">
            <div className="chart-box">
               <div className="section-header">
                  <h3 className="section-title">Category Distribution</h3>
                  <p className="section-subtitle">What segments of your menu are driving the business?</p>
               </div>
               <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                 <div style={{ width: '50%', height: 260 }}>
                  {stats.pie_chart?.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={stats.pie_chart} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} dataKey="value">
                          {stats.pie_chart.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9CA3AF' }}>No data</div>
                  )}
                 </div>
                 <div style={{ width: '50%' }}>
                    {stats.top_categories?.map((c: any, i: number) => (
                      <div className="flex-table-row" key={i}>
                        <div className="flex-table-left">
                          <span className="rank-badge">#{i + 1}</span>
                          <span className="item-name">{c.name}</span>
                        </div>
                        <span className="item-stat">{c.percentage}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
            
            <div className="chart-box">
              <div className="section-header">
                <h3 className="section-title">Top Sellers</h3>
                <p className="section-subtitle">Your most popular items.</p>
              </div>
              <div>
                {stats.top_products?.map((p: any, i: number) => (
                    <div className="flex-table-row" key={i}>
                      <div className="flex-table-left">
                        <span className="rank-badge">#{i + 1}</span>
                        <span className="item-name">{p.name}</span>
                      </div>
                      <span className="item-stat" style={{ color: '#374151' }}>{p.sold} sold</span>
                    </div>
                  ))}
                  {(!stats.top_products || stats.top_products.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>No product sales recorded.</div>
                  )}
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="dashboard-module dashboard-tables">
            <div className="chart-box">
              <div className="section-header">
                <h3 className="section-title">Recent Transactions</h3>
                <p className="section-subtitle">Transactional ledger mapped to the selected period.</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="top-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_orders?.map((o: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{o.order_number}</strong></td>
                        <td>{o.date}</td>
                        <td>{o.items}</td>
                        <td>₹{Number(o.total || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${o.status.toLowerCase() === 'paid' ? 'status-completed' : 'status-pending'}`}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!stats.top_orders || stats.top_orders.length === 0) && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
