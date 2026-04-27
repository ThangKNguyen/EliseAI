export function AnalysisBadge({ status }) {
  const analyzed = status !== 'pending';
  return (
    <span className={`status-badge ${analyzed ? 'processed' : 'pending'}`}>
      <span className={`dot ${analyzed ? 'processed' : 'pending'}`} />
      {analyzed ? 'Analyzed' : 'Pending'}
    </span>
  );
}

export function SdrBadge({ status }) {
  if (status === 'in_progress') {
    return (
      <span className="status-badge in_progress">
        <span className="dot in_progress" />
        In Progress
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="status-badge completed">
        <span className="dot completed" />
        Completed
      </span>
    );
  }
  return (
    <span className="status-badge pending">
      <span className="dot pending" />
      Not Picked Up
    </span>
  );
}

export default function StatusBadge({ status }) {
  const LABELS = { pending: 'Pending', processed: 'Processed', in_progress: 'In Progress', completed: 'Completed' };
  return (
    <span className={`status-badge ${status}`}>
      <span className={`dot ${status}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
