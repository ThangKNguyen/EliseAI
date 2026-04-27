import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

const LogoIcon = () => (
  <svg viewBox="0 0 16 16"><path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" /></svg>
);

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })); setApiError(''); }

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 6) e.password = 'At least 6 characters';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await client.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setApiError(err.response?.data?.detail ?? 'Registration failed. Please try again.');
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join your team on the platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input placeholder="Sarah" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              {errors.first_name && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input placeholder="Chen" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              {errors.last_name && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Create a password" value={form.password} onChange={e => set('password', e.target.value)} />
            {errors.password && <span style={{ fontSize: 11, color: 'var(--high)', marginTop: 4, display: 'block' }}>{errors.password}</span>}
          </div>

          {apiError && (
            <p style={{ fontSize: 13, color: 'var(--high)', marginBottom: 12 }}>{apiError}</p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
