import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const LogoIcon = () => (
  <svg viewBox="0 0 16 16"><path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" /></svg>
);

function getUser() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { first_name: '', last_name: '', email: '' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { first_name: payload.first_name || '', last_name: payload.last_name || '', email: payload.email || '' };
  } catch {
    return { first_name: '', last_name: '', email: '' };
  }
}

export default function Sidebar({ leadCount = 0, workingCount = 0 }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();
  const initials = `${user.first_name[0] || '?'}${user.last_name[0] || ''}`;

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  function close() { setMobileOpen(false); }

  return (
    <>
      <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 16, height: 16 }}>
          <path fillRule="evenodd" d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z" />
        </svg>
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={close} />}

      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark"><LogoIcon /></div>
          <span className="logo-text">EliseAI</span>
          <button className="sidebar-close-btn" onClick={close} aria-label="Close menu">✕</button>
        </div>

        <nav className="nav-section">
          <div className="nav-label">Main</div>

          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={close}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
            </svg>
            All Leads
            {leadCount > 0 && <span className="nav-badge">{leadCount}</span>}
          </NavLink>

          <NavLink to="/working-on" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={close}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Working On
            {workingCount > 0 && <span className="nav-badge">{workingCount}</span>}
          </NavLink>

          <NavLink to="/completed" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={close}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" onClick={handleLogout} title="Sign out">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.first_name} {user.last_name}</div>
              <div className="user-role">SDR</div>
            </div>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, color: 'var(--text-3)', flexShrink: 0 }}>
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 14h-5.5A2.25 2.25 0 013 11.75v-7.5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6 8a.75.75 0 01.75-.75h5.693L11.03 5.836a.75.75 0 111.06-1.06l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l1.413-1.414H6.75A.75.75 0 016 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}
