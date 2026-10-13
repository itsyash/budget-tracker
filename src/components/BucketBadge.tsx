export default function BucketBadge({ bucket }: { bucket: string | null }) {
  if (!bucket) return <span className="muted text-xs">—</span>;
  return (
    <span className="badge text-[11px] font-medium text-[var(--muted)] border-[var(--border)] bg-[var(--panel-2)]">
      {bucket}
    </span>
  );
}
