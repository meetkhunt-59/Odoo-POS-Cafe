import { NavLink, Outlet, Navigate } from "react-router-dom";

export default function Layout({ profile, token, setToken }) {
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>POS Cafe</strong>
        </div>
        <nav className="nav-menu">
          <NavLink to="/pos" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            System Terminal
          </NavLink>
          <NavLink to="/kitchen" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Kitchen Display
          </NavLink>
          <NavLink to="/customer/demo" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Customer Board
          </NavLink>
        </nav>
        <div className="auth-status">
          {profile ? <div className="user-info">{profile.name} ({profile.role})</div> : null}
          <button className="ghost w-full" onClick={() => setToken(null)}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
