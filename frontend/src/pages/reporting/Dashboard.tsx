import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
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
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    loadStats();

    // Auto-refresh stats every 10 seconds for "live" updates
    const intervalId = setInterval(() => {
      fetchDashboardStats(token, period).then(data => setStats(data)).catch(console.error);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardStats(token, period);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Odoo App Color Palette
  const PIE_COLORS = ['#714B67', '#00A09D', '#374151', '#8E6381'];

  return (
    <div className="backend-section dashboard-section">
      <div className="dashboard-top-bar">
        <div className="dashboard-filters">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="monthly">This Month</option>
            <option value="last7">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
          <select defaultValue="all">
            <option value="all">All Employees</option>
            <option value="admin">Administrator</option>
          </select>
          <select defaultValue="all">
            <option value="all">All Sessions</option>
            <option value="s1">Session #0012</option>
          </select>
          <select defaultValue="all">
            <option value="all">All Products</option>
            {products.slice(0, 10).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="dashboard-actions">
          <button className="export-btn odoo-btn-outline"><FileText size={16} /> PDF</button>
          <button className="export-btn odoo-btn-outline"><Download size={16} /> XLS</button>
        </div>
      </div>

      {loading || !stats ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Loader2 className="lucide-spin" size={48} color="#00A09D" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        <>
          <div className="kpi-row">
            <div className="kpi-card">
              <span className="kpi-title">Total Orders</span>
              <span className="kpi-value odoo-purple">{stats.kpis?.total_orders || 0}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Revenue</span>
              <span className="kpi-value odoo-teal">₹{Number(stats.kpis?.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-title">Average Order</span>
              <span className="kpi-value odoo-dark">₹{Number(stats.kpis?.average_order || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-box">
              <h3>Sales Overview</h3>
              <div style={{ width: '100%', height: 300 }}>
                {stats.line_chart?.length > 0 ? (
                  <ResponsiveContainer>
                    <LineChart data={stats.line_chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                      <RechartsTooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="sales" stroke="#00A09D" strokeWidth={3} dot={{ r: 4, fill: '#00A09D', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>No sales data found</div>
                )}
              </div>
            </div>
            <div className="chart-box">
              <h3>Top Categories</h3>
              <div style={{ width: '100%', height: 300 }}>
                {stats.pie_chart?.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={stats.pie_chart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {stats.pie_chart.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>No category sales found</div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-tables">
            <div className="chart-box">
              <h3>Top Orders</h3>
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
                        <td>{o.order_number}</td>
                        <td>{o.date}</td>
                        <td>{o.items}</td>
                        <td>₹{Number(o.total || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${o.status.toLowerCase() === 'paid' ? 'status-completed odoo-badge' : 'status-pending'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!stats.top_orders || stats.top_orders.length === 0) && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="dashboard-widgets">
            <div className="chart-box">
              <h3>Top 5 Products</h3>
              <table className="top-table">
                <tbody>
                  {stats.top_products?.map((p: any, i: number) => (
                    <tr key={i}>
                      <td>{i + 1}. {p.name}</td>
                      <td style={{ textAlign: 'right' }}>{p.sold} sold</td>
                    </tr>
                  ))}
                  {(!stats.top_products || stats.top_products.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748b' }}>No product sales found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="chart-box">
              <h3>Top 5 Categories</h3>
              <table className="top-table">
                <tbody>
                  {stats.top_categories?.map((c: any, i: number) => (
                    <tr key={i}>
                      <td>{i + 1}. {c.name}</td>
                      <td style={{ textAlign: 'right' }}>{c.percentage}</td>
                    </tr>
                  ))}
                  {(!stats.top_categories || stats.top_categories.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: '#64748b' }}>No category sales found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
