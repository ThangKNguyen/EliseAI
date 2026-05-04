import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AnalysisBadge, SdrBadge } from '../components/StatusBadge';
import Toast from '../components/Toast';
import client from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { getPriorityLabel, getPriorityClass, getPriorityEmoji } from '../components/ScoreBadge';

function ScoreRing({ score }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="score-ring">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--accent-mid)" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="score-ring-text">
        <span className="score-number">{score}</span>
        <span className="score-denom">/100</span>
      </div>
    </div>
  );
}

function ScoreBreakdown({ score, enrichment: e }) {
  const bars = [
    { label: 'Rental Market Size', max: 30, val: e?.total_rental_units >= 200000 ? 30 : e?.total_rental_units >= 100000 ? 22 : e?.total_rental_units >= 50000 ? 15 : 5 },
    { label: 'Population Growth', max: 20, val: e?.population_growth_5yr >= 10 ? 20 : e?.population_growth_5yr >= 5 ? 15 : e?.population_growth_5yr >= 0 ? 8 : 0 },
    { label: 'Economic Health', max: 20, val: e?.unemployment_rate < 4 ? 20 : e?.unemployment_rate <= 6 ? 13 : 5 },
    { label: 'Renter Ratio', max: 15, val: e?.renter_ratio >= 0.5 ? 15 : e?.renter_ratio >= 0.4 ? 10 : 5 },
    { label: 'Company Signals', max: 15, val: 13 },
  ];
  return (
    <div className="score-bar-row">
      {bars.map(bar => (
        <div className="score-bar-item" key={bar.label}>
          <div className="score-bar-label">
            <span>{bar.label}</span>
            <span>{bar.val}/{bar.max}</span>
          </div>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${(bar.val / bar.max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="score-bar-total">
        <span>Total Score</span>
        <span>{score}/100</span>
      </div>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [emailBody, setEmailBody] = useState(null);
  const [emailSubject, setEmailSubject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('key');
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [aiSummary, setAiSummary] = useState(null); // initialized from enrichment after load
  const [generatingAi, setGeneratingAi] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    Promise.all([
      client.get(`/leads/${id}`),
      client.get('/leads'),
    ]).then(([detailRes, allRes]) => {
      setLead(detailRes.data);
      setAllLeads(allRes.data);
      if (detailRes.data.enrichment?.ai_summary) {
        setAiSummary(detailRes.data.enrichment.ai_summary);
      }
    }).catch(() => {
      setLead(null);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="app-layout">
      <Sidebar leadCount={0} workingCount={0} />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Loading...</p>
      </div>
    </div>
  );

  if (!lead) return (
    <div className="app-layout">
      <Sidebar leadCount={allLeads.length} workingCount={allLeads.filter(l => l.status === 'in_progress').length} />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state"><h3>Lead not found</h3><p>This lead may have been removed.</p></div>
      </div>
    </div>
  );

  const e = lead.enrichment || {};
  const draftEmail = emailBody ?? e.draft_email ?? '';
  const subject = emailSubject ?? e.email_subject ?? '';
  const talkTrack = e.talk_track ? JSON.parse(e.talk_track) : [];
  const companyNews = e.company_news_headlines ? JSON.parse(e.company_news_headlines) : [];
  const cityNews = e.city_rental_news ? JSON.parse(e.city_rental_news) : [];
  const insights = e.sales_insights ? JSON.parse(e.sales_insights) : null;
  const cityOverview = e.city_overview ? e.city_overview.split('\n')[0].slice(0, 600) + (e.city_overview.length > 600 ? '...' : '') : '';

  const workingCount = allLeads.filter(l => l.status === 'in_progress').length;

  const STATE_NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' };
  const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(`${lead.city}, ${STATE_NAMES[lead.state] || lead.state}`)}`;

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const { data } = await client.post(`/leads/${id}/analyze`);
      setLead(prev => ({ ...prev, status: data.status, score: data.score }));
      const detailRes = await client.get(`/leads/${id}`);
      setLead(detailRes.data);
      setToast('Lead analyzed successfully!');
    } catch {
      setToast('Analysis failed. Check server logs.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAiSummary() {
    setShowAiConfirm(false);
    setGeneratingAi(true);
    try {
      const { data } = await client.post(`/leads/${id}/ai-summary`);
      setAiSummary(data.summary);
    } catch {
      setToast('Failed to generate AI summary.');
    } finally {
      setGeneratingAi(false);
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(draftEmail).then(() => setToast('Email copied to clipboard!'));
  }

  async function handleAddToWorking() {
    try {
      const { data } = await client.patch(`/leads/${id}/assign`);
      setLead(prev => ({ ...prev, status: data.status }));
      setAllLeads(prev => prev.map(l => l.id === id ? { ...l, status: data.status } : l));
      setToast('Lead added to Working On!');
    } catch {
      setToast('Failed to update lead.');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await client.delete(`/leads/${id}`);
      navigate('/dashboard');
    } catch {
      setToast('Failed to delete lead.');
      setDeleting(false);
    }
  }

  async function handleSaveEmail() {
    setSaving(true);
    try {
      await client.patch(`/leads/${id}/email`, { draft_email: draftEmail, email_subject: subject });
      setToast('Email saved!');
    } catch {
      setToast('Failed to save email.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar leadCount={allLeads.length} workingCount={workingCount} />

      <div className="main-content">
        <div className="detail-topbar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
              <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <div className="detail-header-content">
            <h1>{lead.first_name} {lead.last_name} — {lead.company}</h1>
            <p>{lead.property_address}, {lead.city}, {lead.state} · {lead.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)} title="Delete lead">
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                <path d="M11 1.75V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z" />
              </svg>
            </button>
            {lead.score != null && (
              <span className={`badge ${getPriorityClass(lead.score)}`} style={{ fontSize: 13, padding: '5px 12px' }}>
                {getPriorityEmoji(lead.score)} {getPriorityLabel(lead.score)} Priority
              </span>
            )}
            <AnalysisBadge status={lead.status} />
            <SdrBadge status={lead.status} />
            {lead.assigned_user_name && (
              <span style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11, color: 'var(--text-3)' }}>
                  <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
                </svg>
                {lead.assigned_user_name}
              </span>
            )}
            {lead.status === 'pending' && (
              <button className="btn btn-accent-light btn-sm" onClick={handleAnalyze} disabled={analyzing}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.932.75.75 0 01-1.3-.75 6 6 0 019.44-1.242l.842.84V3.227a.75.75 0 01.75-.75zm-.911 7.5A.75.75 0 0113.199 11a6 6 0 01-9.44 1.241l-.84-.84v1.371a.75.75 0 01-1.5 0V9.591a.75.75 0 01.75-.75H5.35a.75.75 0 010 1.5H3.98l.841.841a4.5 4.5 0 007.08-.932.75.75 0 011.025-.273z" clipRule="evenodd" />
                </svg>
                {analyzing ? 'Analyzing...' : 'Analyze This Lead'}
              </button>
            )}
            {lead.status !== 'pending' && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAiConfirm(true)} disabled={generatingAi}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M9.504.43a1.516 1.516 0 012.437 1.713L10.415 5.5h2.123c1.57 0 2.454 1.774 1.518 3.053L8.516 15.31a1.516 1.516 0 01-2.437-1.713L7.585 10.5H5.462c-1.57 0-2.454-1.774-1.518-3.053L9.504.43z" />
                </svg>
                {generatingAi ? 'Generating...' : 'AI Summary'}
              </button>
            )}
            {lead.status === 'processed' && (
              <button className="btn btn-accent-light btn-sm" onClick={handleAddToWorking}>
                <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 13, height: 13 }}>
                  <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
                </svg>
                Add to Working On
              </button>
            )}
          </div>
        </div>

        {lead.status === 'pending' ? (
          <div className="content-body">
            <div className="empty-state" style={{ padding: '80px 20px' }}>
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.836 2.477a.75.75 0 01.75.75v3.182a.75.75 0 01-.75.75h-3.182a.75.75 0 010-1.5h1.37l-.84-.841a4.5 4.5 0 00-7.08.932.75.75 0 01-1.3-.75 6 6 0 019.44-1.242l.842.84V3.227a.75.75 0 01.75-.75zm-.911 7.5A.75.75 0 0113.199 11a6 6 0 01-9.44 1.241l-.84-.84v1.371a.75.75 0 01-1.5 0V9.591a.75.75 0 01.75-.75H5.35a.75.75 0 010 1.5H3.98l.841.841a4.5 4.5 0 007.08-.932.75.75 0 011.025-.273z" clipRule="evenodd" /></svg>
              <h3>Not yet enriched</h3>
              <p>Run the enrichment pipeline from the dashboard, or analyze this lead directly.</p>
              <button className="btn btn-accent-light btn-sm" style={{ marginTop: 16 }} onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Analyze This Lead'}
              </button>
            </div>
          </div>
        ) : (
          <>
          <div className="view-tabs">
            {[['key', 'Key Info'], ['market', 'Market Data'], ['all', 'All']].map(([v, label]) => (
              <button key={v} className={`view-tab${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
                {label}
              </button>
            ))}
          </div>
          <div className="detail-body">
            {/* LEFT COLUMN */}
            <div className="detail-left">
              {/* Score */}
              {(view === 'key' || view === 'all') && <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-title-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.674.25a.75.75 0 01.551.427l1.8 3.998 4.274.617a.75.75 0 01.418 1.272L13.6 9.35l.777 4.292a.75.75 0 01-1.093.793L9 12.39l-4.284 2.045a.75.75 0 01-1.093-.793l.778-4.292-3.117-3.786a.75.75 0 01.418-1.272l4.273-.617 1.8-3.998A.75.75 0 019.674.25z" /></svg>
                    </div>
                    Lead Score
                  </div>
                </div>
                <div className="score-display">
                  <ScoreRing score={lead.score} />
                  <div className="score-info">
                    <h2>{getPriorityLabel(lead.score)} Lead</h2>
                    <p>{insights?.['Market Overview'] ?? 'Enrichment data processed. Review insights below.'}</p>
                  </div>
                </div>
              </div>}

              {/* AI Summary */}
              {aiSummary && (view === 'key' || view === 'all') && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-title-icon">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.504.43a1.516 1.516 0 012.437 1.713L10.415 5.5h2.123c1.57 0 2.454 1.774 1.518 3.053L8.516 15.31a1.516 1.516 0 01-2.437-1.713L7.585 10.5H5.462c-1.57 0-2.454-1.774-1.518-3.053L9.504.43z" /></svg>
                      </div>
                      AI SDR Assessment
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>via Gemini · on demand</span>
                  </div>
                  <div className="card-body">
                    <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Market Insights */}
              {(view === 'market' || view === 'all') && <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-title-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 010 1.5H.75a.75.75 0 01-.75-.75V1.75a.75.75 0 011.5 0zm14.28 2.53l-5.25 5.25a.75.75 0 01-1.06 0L7 7.06 2.53 11.53a.75.75 0 01-1.06-1.06l5-5a.75.75 0 011.06 0L10 7.94l4.72-4.72a.75.75 0 111.06 1.06z" /></svg>
                    </div>
                    Market Insights
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>via Census + FRED + HUD</span>
                </div>
                <div className="card-body">
                  <div className="insights-grid">
                    <div className="insight-item">
                      <div className="insight-label">Rental Units</div>
                      <div className="insight-value">{e.total_rental_units?.toLocaleString() ?? '—'}</div>
                      <div className="insight-sub">In {lead.city} metro</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-label">Population Growth</div>
                      <div className="insight-value">{e.population_growth_5yr != null ? `+${e.population_growth_5yr}%` : '—'}</div>
                      <div className="insight-sub">Over 5 years</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-label">Renter Ratio</div>
                      <div className="insight-value">{e.renter_ratio != null ? `${Math.round(e.renter_ratio * 100)}%` : '—'}</div>
                      <div className="insight-sub">{e.renter_ratio >= 0.5 ? 'Majority renters' : 'Mixed market'}</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-label">Unemployment</div>
                      <div className="insight-value">{e.unemployment_rate != null ? `${e.unemployment_rate}%` : '—'}</div>
                      <div className="insight-sub">{e.unemployment_rate < 4 ? 'Healthy economy' : e.unemployment_rate < 6 ? 'Moderate' : 'Elevated'}</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-label">Walk Score</div>
                      <div className="insight-value">{e.walk_score != null ? `${e.walk_score} / 100` : '—'}</div>
                      <div className="insight-sub">via Tavily</div>
                    </div>
                    <div className="insight-item">
                      <div className="insight-label">2BR Fair Market Rent</div>
                      <div className="insight-value">{e.fmr_two_br != null ? `$${e.fmr_two_br.toLocaleString()}` : '—'}</div>
                      <div className="insight-sub">via HUD · {e.fmr_two_br >= 2000 ? 'Premium market' : e.fmr_two_br >= 1200 ? 'Mid-tier market' : 'Budget market'}</div>
                    </div>
                  </div>
                </div>
              </div>}

              {/* Company Signals */}
              {(view === 'market' || view === 'all') && <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-title-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0114.25 13H8.06l-2.573 2.573A1.457 1.457 0 013 14.543V13H1.75A1.75 1.75 0 010 11.25v-9.5C0 .784.784 0 1.75 0z" clipRule="evenodd" /></svg>
                    </div>
                    Company Signals
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>via Tavily + NewsAPI + OpenCorporates</span>
                </div>
                <div className="card-body">
                  {(insights?.['Company Signals'] || e.company_summary) && (
                    <div className="signal-item">
                      <span className="signal-icon">🏢</span>
                      <div>
                        <div className="signal-title">{lead.company}</div>
                        <div className="signal-sub">{insights?.['Company Signals'] || e.company_summary}</div>
                      </div>
                    </div>
                  )}
                  {(e.company_status || e.company_incorporated) && (
                    <div className="signal-item">
                      <span className="signal-icon">📋</span>
                      <div>
                        <div className="signal-title">
                          {e.company_status === 'active' ? '✓ Active company' : e.company_status ?? 'Registration unknown'}
                          {e.company_jurisdiction ? ` · ${e.company_jurisdiction}` : ''}
                          {e.company_type ? ` ${e.company_type}` : ''}
                        </div>
                        <div className="signal-sub">
                          {e.company_incorporated ? `Incorporated ${e.company_incorporated.slice(0, 4)}` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                  {companyNews.length > 0 && companyNews.map((n, i) => (
                    <div className="signal-item" key={i}>
                      <span className="signal-icon">📰</span>
                      <div>
                        <div className="signal-title">{n.title}</div>
                        <div className="signal-sub">{n.source} · {n.publishedAt?.slice(0, 10)}</div>
                      </div>
                    </div>
                  ))}
                  {!e.company_summary && !companyNews.length && (
                    <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No company signals found.</p>
                  )}
                </div>
              </div>}

              {/* Draft Email */}
              {(view === 'key' || view === 'all') && <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-title-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2A1.75 1.75 0 000 3.75v.736a.75.75 0 000 .027v7.737C0 13.216.784 14 1.75 14h12.5A1.75 1.75 0 0016 12.25v-8.5A1.75 1.75 0 0014.25 2H1.75zM14.5 4.07v-.32a.25.25 0 00-.25-.25H1.75a.25.25 0 00-.25.25v.32L8 7.88l6.5-3.81zm-13 1.74v6.441c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V5.809L8.38 9.397a.75.75 0 01-.76 0L1.5 5.809z" /></svg>
                    </div>
                    Draft Outreach Email
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>via Gemini — editable</span>
                    <button className="btn btn-secondary btn-sm" onClick={handleSaveEmail} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={copyEmail}>Copy</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>Subject</label>
                    <input type="text" value={subject} onChange={e => setEmailSubject(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Body</label>
                    <textarea style={{ minHeight: 200 }} value={draftEmail} onChange={e => setEmailBody(e.target.value)} />
                  </div>
                </div>
              </div>}
            </div>

            {/* RIGHT COLUMN */}
            <div className="detail-right">
              {/* Talk Track */}
              {(view === 'key' || view === 'all') && <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <div className="card-title-icon">
                      <svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0114.25 13H8.06l-2.573 2.573A1.457 1.457 0 013 14.543V13H1.75A1.75 1.75 0 010 11.25Zm1.75-.25a.25.25 0 00-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 01.75.75v2.19l2.72-2.72a.749.749 0 01.53-.22h6.5a.25.25 0 00.25-.25v-9.5a.25.25 0 00-.25-.25Z" /></svg>
                    </div>
                    SDR Talk Track
                  </div>
                </div>
                <div className="card-body">
                  {talkTrack.length > 0 ? (
                    <ul className="talk-track-list">
                      {talkTrack.map((point, i) => (
                        <li key={i}>
                          <div className="track-bullet">{i + 1}</div>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No talk track generated.</p>
                  )}
                </div>
              </div>}

              {/* Market News */}
              {(cityNews.length > 0 || e.market_news) && (view === 'market' || view === 'all') && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-title-icon">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0114.25 14H1.75A1.75 1.75 0 010 12.25Zm1.75-.25a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25ZM3.5 6.25a.75.75 0 01.75-.75h7a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75Zm.75 2.25h4a.75.75 0 010 1.5h-4a.75.75 0 010-1.5Z" /></svg>
                      </div>
                      Market News
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>via NewsAPI + Tavily</span>
                  </div>
                  <div className="card-body">
                    <div className="news-list">
                      {cityNews.map((n, i) => (
                        <a className="news-item" key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                          <div className="news-source">{n.source}</div>
                          <div className="news-headline" style={{ color: n.url ? 'var(--accent-mid)' : 'inherit' }}>{n.title}</div>
                        </a>
                      ))}
                      {e.market_news && cityNews.length === 0 && (
                        <div className="news-item">
                          <div className="news-headline">{e.market_news}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* City Overview */}
              {cityOverview && (view === 'market' || view === 'all') && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-title-icon">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0zm4.879-2.773l4.264 2.559a.25.25 0 010 .428l-4.264 2.559A.25.25 0 016 10.559V5.442a.25.25 0 01.379-.215z" clipRule="evenodd" /></svg>
                      </div>
                      City Overview
                    </div>
                    <a href={wikiUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-mid)', textDecoration: 'none' }} onMouseOver={e => e.target.style.textDecoration='underline'} onMouseOut={e => e.target.style.textDecoration='none'}>via Wikipedia ↗</a>
                  </div>
                  <div className="card-body">
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{cityOverview}</p>
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              {lead.score != null && (view === 'market' || view === 'all') && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <div className="card-title-icon">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 010 1.5H.75a.75.75 0 01-.75-.75V1.75a.75.75 0 011.5 0zm14.28 2.53l-5.25 5.25a.75.75 0 01-1.06 0L7 7.06 2.53 11.53a.75.75 0 01-1.06-1.06l5-5a.75.75 0 011.06 0L10 7.94l4.72-4.72a.75.75 0 111.06 1.06z" /></svg>
                      </div>
                      Score Breakdown
                    </div>
                    <button className="score-info-btn" onClick={() => setShowScoreInfo(true)} title="How is this scored?">!</button>
                  </div>
                  <div className="card-body">
                    <ScoreBreakdown score={lead.score} enrichment={e} />
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {showAiConfirm && (
        <ConfirmModal
          title="Generate AI Summary"
          message="This will send all enriched lead data to Gemini to generate a professional SDR assessment. This uses one Gemini API call."
          confirmLabel="Generate"
          onConfirm={handleAiSummary}
          onCancel={() => setShowAiConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Lead"
          message={`This will permanently remove ${lead.first_name} ${lead.last_name} and all enrichment data. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={deleting}
        />
      )}

      {showScoreInfo && (
        <div className="modal-overlay" onClick={() => setShowScoreInfo(false)}>
          <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">How Scoring Works</span>
              <button className="modal-close" onClick={() => setShowScoreInfo(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="score-info-item">
                <div className="score-info-label">Rental Market Size <span className="score-info-pts">30 pts</span></div>
                <div className="score-info-desc">Pulled from the U.S. Census API (ACS 5-year estimates). Larger rental markets mean more units to manage — a bigger opportunity for EliseAI.</div>
                <div className="score-info-tiers">
                  <span>200k+ units → 30</span><span>100k+ → 22</span><span>50k+ → 15</span><span>Below → 5</span>
                </div>
              </div>
              <div className="score-info-item">
                <div className="score-info-label">Population Growth <span className="score-info-pts">20 pts</span></div>
                <div className="score-info-desc">5-year growth rate from Census ACS data (2017 vs 2022). Growing cities have rising rental demand, which increases leasing workload and makes automation more valuable.</div>
                <div className="score-info-tiers">
                  <span>10%+ → 20</span><span>5%+ → 15</span><span>0%+ → 8</span><span>Declining → 0</span>
                </div>
              </div>
              <div className="score-info-item">
                <div className="score-info-label">Economic Health <span className="score-info-pts">20 pts</span></div>
                <div className="score-info-desc">State unemployment rate from FRED (Federal Reserve). Lower unemployment means tenants can afford rent, reducing vacancy and collection issues — a healthier operator environment.</div>
                <div className="score-info-tiers">
                  <span>Under 4% → 20</span><span>4–6% → 13</span><span>Above 6% → 5</span>
                </div>
              </div>
              <div className="score-info-item">
                <div className="score-info-label">Renter Ratio <span className="score-info-pts">15 pts</span></div>
                <div className="score-info-desc">Percentage of households that rent, from Census ACS. Higher renter concentration means the market is more dependent on professional property management.</div>
                <div className="score-info-tiers">
                  <span>50%+ → 15</span><span>40–50% → 10</span><span>Below 40% → 5</span>
                </div>
              </div>
              <div className="score-info-item">
                <div className="score-info-label">Company Signals <span className="score-info-pts">15 pts</span></div>
                <div className="score-info-desc">Based on data from Tavily (web search), NewsAPI, and OpenCorporates. Evaluates whether the company has an active web presence, recent news coverage, and verified registration. No AI scoring — presence of data = signal of legitimacy and activity.</div>
                <div className="score-info-tiers">
                  <span>Data found → 13</span><span>No data → 5</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                AI (Gemini) is used for: the draft email, talk track, sales insights, company signals synthesis, and the on-demand AI SDR Assessment. The numeric score is rule-based only — no AI involved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
