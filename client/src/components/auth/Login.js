import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  if (user) {
    const techRoles = ['electrician', 'dwaraka'];
    return <Navigate to={techRoles.includes(user.role) ? '/maintenance' : '/dashboard'} />;
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
        const techRoles = ['electrician', 'dwaraka'];
        navigate(techRoles.includes(u.role) ? '/maintenance' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="sun-logo">☀️</div>
        <h1>Solar Management</h1>
        <p className="subtitle">{isRegister ? 'Create your account' : 'Sign in to your account'}</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text" name="name" className="form-control"
                value={form.name} onChange={handleChange} required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email" name="email" className="form-control"
              value={form.email} onChange={handleChange} required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password" name="password" className="form-control"
              value={form.password} onChange={handleChange} required
              minLength={6} placeholder="Enter your password"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel" name="phone" className="form-control"
                value={form.phone} onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>

        {!isRegister && (
          <div style={{
            marginTop: 20, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, fontSize: 13, color: '#166534',
          }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Demo Credentials</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span><b>Admin:</b> admin@solar.com / admin123</span>
              <span><b>Developer:</b> dev@solar.com / dev123</span>
              <span><b>Employee:</b> ravi@solar.com / ravi123</span>
              <span><b>Employee:</b> sneha@solar.com / sneha123</span>
              <span><b>Electrician:</b> sunil@solar.com / sunil123</span>
              <span><b>Dwaraka Group:</b> dwaraka@solar.com / dwaraka123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
