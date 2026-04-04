import { useState } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuthStore } from '../store/authStore';

export default function ProfileSettingsPage() {
  const profile = useAuthStore(s => s.profile);
  const [name, setName] = useState(profile?.name || '');

  return (
    <div className="pos-dashboard-root">
      <DashboardNavbar />
      <main className="pos-dashboard-main" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '1.5rem' }}>Profile Settings</h1>

        <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Role</label>
            <input
              type="text"
              value={profile?.role || 'Admin'}
              disabled
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#6B7280' }}
            />
          </div>
          <button
            style={{ padding: '0.75rem 1.5rem', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => alert('Profile update functionality coming soon.')}
          >
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}
