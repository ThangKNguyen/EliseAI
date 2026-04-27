import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AddLeadModal from '../components/AddLeadModal';
import ScoreBadge from '../components/ScoreBadge';
import { AnalysisBadge, SdrBadge } from '../components/StatusBadge';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import client from '../api/client';

const ANALYSIS_FILTERS = ['All', 'Pending', 'Analyzed'];
const SDR_FILTERS = ['All', 'Not Picked Up', 'In Progress', 'Completed'];

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisFilter, setAnalysisFilter] = useState('All');
  const [sdrFilter, setSdrFilter] = useState('All');
  const [sort, setSort] = useState('score');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  const fileInputRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    try {
      const { data } = await client.get('/leads');
      setLeads(data);
    } catch {
      setToast('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }

  const workingCount = leads.filter(l => l.status === 'in_progress').length;

  const visible = leads
    .filter(l => {
      if (analysisFilter === 'Pending') return l.status === 'pending';
      if (analysisFilter === 'Analyzed') return l.status !== 'pending';
      return true;
    })
    .filter(l => {
      if (sdrFilter === 'Not Picked Up') return l.status !== 'in_progress' && l.status !== 'completed';
      if (sdrFilter === 'In Progress') return l.status === 'in_progress';
      if (sdrFilter === 'Completed') return l.status === 'completed';
      return true;
    })
    .sort((a, b) => {
      if (sort === 'score') return (b.score ?? -1) - (a.score ?? -1);
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return 0;
    });

  const stats = {
    total: leads.length,
    pending: leads.filter(l => l.status === 'pending').length,
    high: leads.filter(l => l.score >= 80).length,
    inProgress: workingCount,
  };

  async function handleAddLead(form) {
    try {
      const { data } = await client.post('/leads', form);
      setLeads(prev => [data, ...prev]);
      setToast('Lead added successfully!');
    } catch {
      setToast('Failed to add lead.');
    }
  }

  async function analyzeOne(id) {
    setAnalyzingIds(prev => new Set(prev).add(id));
    try {
      const { data } = await client.post(`/leads/${id}/analyze`);
      setLeads(prev => prev.map(l => l.id === id ? data : l));
    } finally {
      setAnalyzingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function handleRunPipeline() {
    const pending = leads.filter(l => l.status === 'pending');
    if (!pending.length) { setToast('No pending leads to process.'); return; }
    cancelledRef.current = false;
    setPipelineRunning(true);
    let done = 0;
    for (const lead of pending) {
      if (cancelledRef.current) break;
      try { await analyzeOne(lead.id); done++; } catch { /* continue */ }
    }
    setPipelineRunning(false);
    setToast(cancelledRef.current
      ? `Cancelled — ${done} lead${done !== 1 ? 's' : ''} enriched before stopping.`
      : `Pipeline complete — ${done} lead${done !== 1 ? 's' : ''} enriched!`
    );
  }

  async function handleAnalyzeSingle(id) {
    try { await analyzeOne(id); setToast('Lead analyzed!'); } catch { setToast('Analysis failed.'); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await client.delete(`/leads/${deleteId}`);
      setLeads(prev => prev.filter(l => l.id !== deleteId));
      setDeleteId(null);
      setToast('Lead deleted.');
    } catch {
      setToast('Failed to delete lead.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAnalyzeSingle(id) {
    setAnalyzingId(id);
    try {
      const { data } = await client.post(`/leads/${id}/analyze`);
      setLeads(prev => prev.map(l => l.id === id ? data : l));
      setToast('Lead analyzed successfully!');
    } catch {
      setToast('Analysis failed. Check server logs.');
    } finally {
      setAnalyzingId(null);
    }
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['first_name', 'last_name', 'email', 'company', 'property_address', 'city', 'state'];
    if (!required.every(r => headers.includes(r))) return null;
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    }).filter(row => required.every(r => row[r]));
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows === null) {
      setToast('Invalid file format. Check column headers match the sample.');
      setUploading(false);
      return;
    }
    if (rows.length === 0) {
      setToast('No valid leads found in file.');
      setUploading(false);
      return;
    }
    try {
      const created = await Promise.all(rows.map(row => client.post('/leads', row).then(r => r.data)));
      setLeads(prev => [...created, ...prev]);
      setToast(`${created.length} lead${created.length !== 1 ? 's' : ''} imported successfully!`);
    } catch {
      setToast('Failed to import some leads. Check the file and try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar leadCount={leads.length} workingCount={workingCount} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>All Leads</h1>
            <p>Manage and prioritize your inbound pipeline</p>
          </div>
          <div className="topbar-actions">
            <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                <path d="M8.75 1.75a.75.75 0 00-1.5 0V7H2a.75.75 0 000 1.5h5.25v5.25a.75.75 0 001.5 0V8.5H14A.75.75 0 0014 7H8.75V1.75z" />
                <path d="M1 12.5A1.5 1.5 0 002.5 14h11a1.5 1.5 0 001.5-1.5v-2a.75.75 0 00-1.5 0v2h-11v-2a.75.75 0 00-1.5 0v2z" />
              </svg>
              {uploading ? 'Importing...' : 'Import CSV'}
            </button>
            {pipelineRunning ? (
              <button className="btn btn-danger btn-sm" onClick={() => cancelledRef.current = true}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
                Cancel
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={handleRunPipeline}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M3 3.732a1.5 1.5 0 012.305-1.265l6.706 4.267a1.5 1.5 0 010 2.531l-6.706 4.268A1.5 1.5 0 013 12.267V3.732z" />
                </svg>
                Run Pending Leads
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
              </svg>
              Add Lead
            </button>
          </div>
        </div>

        <div className="content-body">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Leads</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-sub">All time</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-sub">Not yet enriched</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">High Priority</div>
              <div className="stat-value">{stats.high}</div>
              <div className="stat-sub">Score 80+</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-sub">Being worked on</div>
            </div>
          </div>

          {pipelineRunning && (
            <div className="pipeline-banner">
              <svg className="spin" viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.932.75.75 0 01-1.3-.75 6 6 0 019.44-1.242l.842.84V3.227a.75.75 0 01.75-.75zm-.911 7.5A.75.75 0 0113.199 11a6 6 0 01-9.44 1.241l-.84-.84v1.371a.75.75 0 01-1.5 0V9.591a.75.75 0 01.75-.75H5.35a.75.75 0 010 1.5H3.98l.841.841a4.5 4.5 0 007.08-.932.75.75 0 011.025-.273z" clipRule="evenodd" />
              </svg>
              Running enrichment pipeline on {stats.pending} pending lead{stats.pending !== 1 ? 's' : ''}...
            </div>
          )}

          <div className="filters-bar">
            <div className="filter-tabs">
              {ANALYSIS_FILTERS.map(f => (
                <button key={f} className={`filter-tab${analysisFilter === f ? ' active' : ''}`} onClick={() => setAnalysisFilter(f)}>{f}</button>
              ))}
            </div>
            <select className="sort-select" value={sdrFilter} onChange={e => setSdrFilter(e.target.value)}>
              <option value="All">SDR: All</option>
              <option value="Not Picked Up">SDR: Not Picked Up</option>
              <option value="In Progress">SDR: In Progress</option>
              <option value="Completed">SDR: Completed</option>
            </select>
            <select className="sort-select ml-auto" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="score">Sort: Highest Score</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Location</th>
                  <th>Score</th>
                  <th>Priority</th>
                  <th>Analysis</th>
                  <th>SDR Status</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading leads...</td></tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" /></svg>
                        <h3>No leads found</h3>
                        <p>Try a different filter or add a new lead.</p>
                      </div>
                    </td>
                  </tr>
                ) : visible.map(lead => (
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
                    <td><AnalysisBadge status={lead.status} /></td>
                    <td><SdrBadge status={lead.status} /></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(lead.created_at)}</td>
                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {(lead.status === 'pending' || analyzingIds.has(lead.id)) && (
                          <button
                            className="analyze-btn"
                            onClick={() => !pipelineRunning && handleAnalyzeSingle(lead.id)}
                            disabled={analyzingIds.has(lead.id) || pipelineRunning}
                            title={pipelineRunning ? 'Pipeline running...' : 'Analyze this lead'}
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }} className={(analyzingIds.has(lead.id) || pipelineRunning) ? 'spin' : ''}>
                              {(analyzingIds.has(lead.id) || pipelineRunning)
                                ? <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.932.75.75 0 01-1.3-.75 6 6 0 019.44-1.242l.842.84V3.227a.75.75 0 01.75-.75zm-.911 7.5A.75.75 0 0113.199 11a6 6 0 01-9.44 1.241l-.84-.84v1.371a.75.75 0 01-1.5 0V9.591a.75.75 0 01.75-.75H5.35a.75.75 0 010 1.5H3.98l.841.841a4.5 4.5 0 007.08-.932.75.75 0 011.025-.273z" clipRule="evenodd" />
                                : <path d="M3 3.732a1.5 1.5 0 012.305-1.265l6.706 4.267a1.5 1.5 0 010 2.531l-6.706 4.268A1.5 1.5 0 013 12.267V3.732z" />
                              }
                            </svg>
                          </button>
                        )}
                        <button className="delete-btn" onClick={() => setDeleteId(lead.id)} title="Delete lead">
                          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                            <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <AddLeadModal onClose={() => setShowModal(false)} onAdd={handleAddLead} />}
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
