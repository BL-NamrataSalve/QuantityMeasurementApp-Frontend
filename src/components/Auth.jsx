import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!isLogin && !name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    const url = isLogin 
      ? '/auth/api/v1/auth/login' 
      : '/auth/api/v1/auth/register';
      
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await axios.post(url, payload);
      const data = response.data;
      
      if (data && data.token) {
        if (!isLogin) {
          setSuccess('Registration successful! Logging you in...');
        }
        
        // Save auth data in localStorage
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify({
          name: data.name || name || email.split('@')[0],
          email: data.email || email,
          role: data.role || 'ROLE_USER'
        }));
        
        setTimeout(() => {
          onAuthSuccess(data.token, data);
        }, 800);
      } else {
        setError('Response from server did not contain authentication credentials.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const backendError = err.response.data;
        if (typeof backendError === 'string') {
          setError(backendError);
        } else if (backendError.message) {
          setError(backendError.message);
        } else if (Array.isArray(backendError.errors)) {
          setError(backendError.errors.join(', '));
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } else {
        setError('Server is unreachable. Please verify that your backend microservices are running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_API_GATEWAY_URL + '/auth/oauth2/authorization/google';
  };

  return (
    <div className="auth-container glass-panel animated-fadeIn">
      <div className="auth-header">
        <div className="auth-logo">
          <span className="app-logo-icon">⚖️</span>
          <span>QuantityManagement</span>
        </div>
        <p className="auth-subtitle">Enterprise Quantity Measurement System</p>
      </div>

      <div className="auth-tabs">
        <button 
          className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
          onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
          type="button"
        >
          Log In
        </button>
        <button 
          className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
          onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
          type="button"
        >
          Sign Up
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginBottom: '0px' }}
        >
          {loading && <span className="spinner"></span>}
          {isLogin ? 'Log In' : 'Sign Up'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }}></div>
          <span style={{ padding: '0 10px', fontSize: '13px', color: 'var(--text-muted)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }}></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="btn btn-secondary btn-full"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>
    </div>
  );
}
