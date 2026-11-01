export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="adm-toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`adm-toast is-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
          <i aria-hidden="true">{toast.tone === 'error' ? '!' : '✓'}</i>
          <span>{toast.text}</span>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Tutup">×</button>
        </div>
      ))}
    </div>
  );
}
