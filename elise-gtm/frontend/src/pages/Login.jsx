import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const LogoIcon = () => (
  <svg viewBox="0 0 16 16"><path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" /></svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setError(''); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', form);
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-circle c1" />
      <div className="auth-bg-circle c2" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark"><LogoIcon /></div>
          <span className="auth-logo-text">EliseAI</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <div
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, cursor: 'pointer' }}
          onClick={() => { set('email', 'test@test.com'); set('password', 'password123'); }}
          title="Click to autofill"
        >
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Demo credentials <span style={{ color: 'var(--accent-mid)' }}>· click to autofill</span></p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>test@test.com · password123</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--high)', marginBottom: 12 }}>{error}</p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
