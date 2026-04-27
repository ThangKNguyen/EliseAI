import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScoreBadge from '../components/ScoreBadge';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import client from '../api/client';

export default function WorkingOn() {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState([]);
  const [leads, setLeads] = useState([]);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client.get('/leads').then(({ data }) => {
      setAllLeads(data);
      setLeads(data.filter(l => l.status === 'in_progress'));
    });
  }, []);

  const workingCount = leads.length;

  async function handleDelete() {
    setDeleting(true);
    try {
      await client.delete(`/leads/${deleteId}`);
      setLeads(prev => prev.filter(l => l.id !== deleteId));
      setAllLeads(prev => prev.filter(l => l.id !== deleteId));
      setDeleteId(null);
      setToast('Lead deleted.');
    } catch {
      setToast('Failed to delete lead.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleComplete(id, e) {
    e.stopPropagation();
    try {
      await client.patch(`/leads/${id}/status`, { status: 'completed' });
      setLeads(prev => prev.filter(l => l.id !== id));
      setAllLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'completed' } : l));
      setToast('Lead marked as complete!');
    } catch {
      setToast('Failed to update lead.');
    }
  }

  return (
    <div className="app-layout">
      <Sidebar leadCount={allLeads.length} workingCount={workingCount} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Working On</h1>
            <p>Leads you're actively pursuing · {workingCount} open</p>
          </div>
        </div>

        <div className="content-body">
          {leads.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <h3>Nothing in progress</h3>
              <p>Open a lead from the dashboard and click "Add to Working On" to track it here.</p>
            </div>
          ) : (
            <div className="working-grid">
              {leads.map(lead => (
                <div key={lead.id} className="lead-card" onClick={() => navigate(`/leads/${lead.id}`)}>
                  <div className="lead-card-header">
                    <div>
                      <div className="lead-card-name">{lead.first_name} {lead.last_name}</div>
                      <div className="lead-card-company">{lead.company}</div>
                    </div>
                    {lead.score != null && <ScoreBadge score={lead.score} />}
                  </div>

                  <div className="lead-card-meta">
                    <span className="meta-chip">
                      <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                        <path fillRule="evenodd" d="M1.75 2.5a.75.75 0 000 1.5h.94l1.06 10.625A1.75 1.75 0 005.5 16h5a1.75 1.75 0 001.75-1.375L13.31 4h.94a.75.75 0 000-1.5H1.75zm3.91 12l-.964-9.5h6.608l-.964 9.5H5.66z" clipRule="evenodd" />
                      </svg>
                      {lead.city}, {lead.state}
                    </span>
                    {lead.score != null && (
                      <span className="meta-chip">
                        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                          <path d="M9.674.25a.75.75 0 01.551.427l1.8 3.998 4.274.617a.75.75 0 01.418 1.272L13.6 9.35l.777 4.292a.75.75 0 01-1.093.793L9 12.39l-4.284 2.045a.75.75 0 01-1.093-.793l.778-4.292-3.117-3.786a.75.75 0 01.418-1.272l4.273-.617 1.8-3.998A.75.75 0 019.674.25z" />
                        </svg>
                        Score {lead.score}/100
                      </span>
                    )}
                  </div>

                  <div className="lead-card-footer" onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{lead.email}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="delete-btn" onClick={() => setDeleteId(lead.id)} title="Delete lead">
                        <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                          <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z" />
                        </svg>
                      </button>
                      <button className="btn btn-accent-light btn-sm" onClick={(e) => handleComplete(lead.id, e)}>
                        Mark Complete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {deleteId && (
        <ConfirmModal
          title="Delete Lead"
          message="This will permanently remove the lead and all enrichment data. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
