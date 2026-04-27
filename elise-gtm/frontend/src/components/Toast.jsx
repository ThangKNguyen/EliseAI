import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast">
      <div className="toast-icon">
        <svg viewBox="0 0 12 12" fill="white" style={{ width: 10, height: 10 }}>
          <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
        </svg>
      </div>
      {message}
    </div>
  );
}
