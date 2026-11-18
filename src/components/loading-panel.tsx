export function LoadingPanel({ title = "Loading", hint = "Please wait a moment." }: { title?: string; hint?: string }) {
  return (
    <div className="loading-panel" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-panel__card">
        <span className="loading-panel__spinner" aria-hidden="true" />
        <p className="loading-panel__title">{title}</p>
        <p className="loading-panel__hint">{hint}</p>
      </div>
    </div>
  );
}
