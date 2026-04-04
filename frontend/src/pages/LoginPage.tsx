import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, requestReset, updatePassword, loading, error } = useAuthStore();

  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [isVerify, setIsVerify] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [keepLogged, setKeepLogged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isVerify) {
        await updatePassword(email, otp, password);
        // Silently transition back to default login state
        setIsVerify(false);
        setPassword('');
        setOtp('');
      } else if (isForgot) {
        await requestReset(email);
        alert('If that email exists, an OTP code has been sent. Check your inbox.');
        setIsForgot(false);
        setIsVerify(true);
        setPassword('');
      } else if (isSignup) {
        await signup(email, password, name);
        alert('Account created! Now login with those credentials.');
        setIsSignup(false);
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch {
      // error is already dynamically set in authStore
    }
  };

  const resetState = () => {
    setIsSignup(false);
    setIsForgot(false);
    setIsVerify(false);
    setOtp('');
    setPassword('');
  }

  return (
    <div className="luxury-login-page">
      {/* Left side: Beautiful abstract gradient & quote */}
      <div className="luxury-left-pane">
        <div className="luxury-quote-header">
          The Premier Solution
        </div>
        <div className="luxury-quote-bottom">
          <h1>Empower<br/>Your<br/>Cafe</h1>
          <p>
            Seamlessly manage orders, delight your customers, and scale your business with an intuitive, all-in-one culinary platform.
          </p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="luxury-right-pane">
        <div className="luxury-top-logo">
          <img src="/odoo-pos-logo.png" alt="Odoo POS" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          Odoo POS Cafe
        </div>

        <div className="luxury-form-wrapper">
          <div className="luxury-form-header">
            <h2>{isVerify ? 'Set New Password' : isForgot ? 'Reset Password' : isSignup ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isVerify ? 'Enter the 6-digit code sent to your email to verify' : isForgot ? 'Enter your email to receive an OTP code' : isSignup ? 'Enter your details to create an account' : 'Enter your email and password to access your account'}</p>
          </div>

          {error && <div className="luxury-error">{error}</div>}

          <form onSubmit={handleSubmit} className="luxury-form">
            {/* NAME block (only visible during fresh signup) */}
            {isSignup && !isForgot && !isVerify && (
              <div className="luxury-input-group">
                <label htmlFor="name">Name</label>
                <div className="luxury-input-wrapper">
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP block (only visible during verification) */}
            {isVerify && (
              <div className="luxury-input-group">
                <label htmlFor="otp">6-Digit OTP Code</label>
                <div className="luxury-input-wrapper">
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* EMAIL block (visible normally and during forgot password request, disabled during verifications) */}
            <div className="luxury-input-group">
              <label htmlFor="email">Email</label>
              <div className="luxury-input-wrapper">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerify} // freeze email if we sent OTP
                  required
                />
              </div>
            </div>

            {/* PASSWORD block (hidden only during 'forget password request' state) */}
            {(!isForgot || isVerify) && (
              <div className="luxury-input-group">
                <label htmlFor="password">{isVerify ? 'New Password' : 'Password'}</label>
                <div className="luxury-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isVerify ? "Enter a new secure password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  {showPassword ? 
                    <EyeOff className="input-icon-right" size={18} onClick={() => setShowPassword(false)} /> : 
                    <Eye className="input-icon-right" size={18} onClick={() => setShowPassword(true)} />
                  }
                </div>
              </div>
            )}

            {/* ROW Actions (only on default login pane) */}
            {!isSignup && !isForgot && !isVerify && (
              <div className="luxury-actions-row">
                <label className="luxury-checkbox">
                  <input
                    type="checkbox"
                    checked={keepLogged}
                    onChange={(e) => setKeepLogged(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="luxury-forgot-btn" onClick={() => setIsForgot(true)}>
                  Forgot Password
                </button>
              </div>
            )}

            <button type="submit" className="luxury-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : isVerify ? 'Update Password' : isForgot ? 'Send OTP Code' : isSignup ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="luxury-bottom-toggle">
          {isVerify || isForgot ? (
            <button className="luxury-forgot-btn" style={{fontSize: "14px", fontWeight: "600"}} onClick={resetState}>Cancel & Back to Login</button>
          ) : isSignup ? (
             <span>Already have an account? <button onClick={() => setIsSignup(false)}>Sign In</button></span>
          ) : (
             <span>Don't have an account? <button onClick={() => setIsSignup(true)}>Sign Up</button></span>
          )}
        </div>
      </div>
    </div>
  );
}