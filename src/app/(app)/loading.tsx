export default function AppLoading() {
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="h-7 w-40 bg-[var(--panel-2)] rounded-md mb-2 border border-[var(--border)]" />
          <div className="h-3.5 w-60 bg-[var(--panel-2)] rounded" />
        </div>
        <div className="h-8 w-24 bg-[var(--panel-2)] rounded-md border border-[var(--border)]" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-3.5 h-20 flex flex-col justify-between">
            <div className="h-2.5 w-16 bg-[var(--panel-2)] rounded" />
            <div className="h-5 w-24 bg-[var(--panel-2)] rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content card skeleton */}
      <div className="card p-4 min-h-[300px] flex flex-col gap-2.5">
        <div className="h-4 w-full bg-[var(--panel-2)] rounded" />
        <div className="h-9 w-full bg-[var(--panel-2)] rounded" />
        <div className="h-9 w-full bg-[var(--panel-2)] rounded" />
        <div className="h-9 w-full bg-[var(--panel-2)] rounded" />
        <div className="h-9 w-full bg-[var(--panel-2)] rounded" />
        <div className="h-9 w-full bg-[var(--panel-2)] rounded" />
      </div>
    </div>
  );
}
