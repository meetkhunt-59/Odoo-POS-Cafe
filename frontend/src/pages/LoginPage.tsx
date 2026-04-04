import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, loading, error } = useAuthStore();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await signup(email, password, name);
        alert('Admin created! Now login with those credentials.');
        setIsSignup(false);
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch {
      // error is already set in store
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">🌿</div>
          <h1>CHILI POS</h1>
          <p className="login-subtitle">Restaurant Management System</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Administrator Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="operator@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Admin Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-toggle">
          {isSignup ? (
            <span>Already have an account? <button onClick={() => setIsSignup(false)}>Sign In</button></span>
          ) : (
            <span>First time setup? <button onClick={() => setIsSignup(true)}>Create Admin</button></span>
          )}
        </div>
      </div>
    </div>
  );
}