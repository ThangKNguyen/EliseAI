import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScoreBadge from '../components/ScoreBadge';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import client from '../api/client';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Completed() {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState([]);
  const [leads, setLeads] = useState([]);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client.get('/leads').then(({ data }) => {
      setAllLeads(data);
      setLeads(data.filter(l => l.status === 'completed'));
    });
  }, []);

  const workingCount = allLeads.filter(l => l.status === 'in_progress').length;

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

  return (
    <div className="app-layout">
      <Sidebar leadCount={allLeads.length} workingCount={workingCount} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Completed</h1>
            <p>Leads you've finished working · {leads.length} total</p>
          </div>
        </div>

        <div className="content-body">
          {leads.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3>No completed leads yet</h3>
              <p>Mark leads as complete from the Working On page.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Location</th>
                    <th>Score</th>
                    <th>Priority</th>
                    <th>SDR</th>
                    <th>Completed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                      <td>
                        <div className="lead-name">{lead.first_name} {lead.last_name}</div>
                        <div className="lead-company">{lead.company}</div>
                      </td>
                      <td className="lead-location">{lead.city}, {lead.state}</td>
                      <td>
                        {lead.score != null
                          ? <span className="score-pill">{lead.score}<span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>/100</span></span>
                          : <span style={{ color: 'var(--text-3)' }}>—</span>
                        }
                      </td>
                      <td><ScoreBadge score={lead.score} /></td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{lead.assigned_user_name ?? '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(lead.updated_at)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="delete-btn" onClick={() => setDeleteId(lead.id)} title="Delete lead">
                          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                            <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
