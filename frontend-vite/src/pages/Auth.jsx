import { Navigate } from "react-router-dom";

export default function Auth({ token, handleSignup, handleLogin, authError }) {
  if (token) {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="auth-page screen-center">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Odoo POS Cafe</h1>
          <p className="muted">Welcome staff! Sign in to open the terminal.</p>
        </div>
        
        {authError && <div className="alert error">{authError}</div>}

        <div className="grid two gap-xl">
          <section className="login-section">
            <h2>Log In</h2>
            <form className="stack" onSubmit={handleLogin}>
              <input name="email" type="email" placeholder="Operator Email" required />
              <input name="password" type="password" placeholder="Passcode" required />
              <button type="submit" className="primary-btn">Initialize Session</button>
            </form>
          </section>

          <section className="signup-section">
            <h2>Initial Setup</h2>
            <form className="stack" onSubmit={handleSignup}>
              <input name="name" placeholder="Administrator Name" required />
              <input name="email" type="email" placeholder="Admin Email" required />
              <input name="password" type="password" placeholder="Secure Password" minLength={6} required />
              <button type="submit" className="ghost">Create Admin</button>
              <p className="hint">Only permitted once for bootstrap.</p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
