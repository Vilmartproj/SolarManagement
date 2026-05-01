import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../shared/Logo';

export default function Login({ onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/dashboard" />;
    const techRoles = ['electrician', 'dwcra'];
    return <Navigate to={techRoles.includes(user.role) ? '/maintenance' : '/projects'} />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        await register(form);
        setSuccess('Registration successful! Please login.');
        setIsRegister(false);
        setForm({ name: '', email: '', password: '', phone: '' });
      } else {
        const u = await login(form.email, form.password);
        if (u.role === 'admin') navigate('/dashboard');
        else {
          const techRoles = ['electrician', 'dwcra'];
          navigate(techRoles.includes(u.role) ? '/maintenance' : '/projects');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="login-sidebar-overlay" onClick={onClose}>
      <div className="login-sidebar-drawer glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="login-close-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="login-header">
          <div className="sun-logo pulse-animation" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Logo size={80} />
          </div>
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Cheriesh Power Technologies</h1>
        </div>
        <p className="subtitle">{isRegister ? 'Create your account' : 'Welcome back! Sign in to continue.'}</p>

        {error && <div className="error-message slide-in">{error}</div>}
        {success && <div className="success-message slide-in">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group floating-group">
              <input
                type="text" name="name" id="name" className="form-control float-input"
                value={form.name} onChange={handleChange} required
                placeholder=" "
              />
              <label htmlFor="name" className="float-label">Full Name</label>
            </div>
          )}

          <div className="form-group floating-group">
            <input
              type="email" name="email" id="email" className="form-control float-input"
              value={form.email} onChange={handleChange} required
              placeholder=" "
            />
            <label htmlFor="email" className="float-label">Email Address</label>
          </div>

          <div className="form-group floating-group">
            <input
              type={showPassword ? "text" : "password"} name="password" id="password" className="form-control float-input"
              value={form.password} onChange={handleChange} required
              minLength={6} placeholder=" "
            />
            <label htmlFor="password" className="float-label">Password</label>
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>

          {isRegister && (
            <div className="form-group floating-group">
              <input
                type="tel" name="phone" id="phone" className="form-control float-input"
                value={form.phone} onChange={handleChange}
                placeholder=" "
              />
              <label htmlFor="phone" className="float-label">Phone Number</label>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%', marginTop: 16 }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer-text">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            className="toggle-auth-btn"
          >
            {isRegister ? 'Log In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
