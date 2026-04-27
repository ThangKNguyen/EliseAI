export function getPriorityLabel(score) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

export function getPriorityClass(score) {
  if (score >= 80) return 'badge-high';
  if (score >= 60) return 'badge-mid';
  return 'badge-low';
}

export function getPriorityEmoji(score) {
  if (score >= 80) return '🔴';
  if (score >= 60) return '🟡';
  return '🟢';
}

export default function ScoreBadge({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const label = getPriorityLabel(score);
  const cls = getPriorityClass(score);
  const emoji = getPriorityEmoji(score);
  return <span className={`badge ${cls}`}>{emoji} {label}</span>;
}
