export function LineStatus({
  connected,
  connectedLabel,
  disconnectedLabel,
}: {
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        connected ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-mist text-muted ring-line"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${connected ? "bg-emerald-500" : "bg-muted"}`}
      />
      {connected ? connectedLabel : disconnectedLabel}
    </span>
  );
}
