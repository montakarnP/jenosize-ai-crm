export function UnreadBadge({ count, label }: { count: number; label: string }) {
  if (count < 1) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
      {count > 1 ? `${label} ${count}` : label}
    </span>
  );
}
