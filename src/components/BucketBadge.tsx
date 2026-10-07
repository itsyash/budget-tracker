import { BUCKET_COLORS, type Bucket } from "@/lib/constants";

export default function BucketBadge({ bucket }: { bucket: string | null }) {
  if (!bucket) return <span className="muted">—</span>;
  const color = BUCKET_COLORS[bucket as Bucket] ?? "#64748b";
  return (
    <span className="badge" style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}>
      {bucket}
    </span>
  );
}
