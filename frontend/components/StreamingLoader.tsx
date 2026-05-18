interface StreamingLoaderProps {
  /** Number of skeleton cards to render. Defaults to 3. */
  count?: number;
}

export default function StreamingLoader({ count = 3 }: StreamingLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Analyzing document clauses…"
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-800 bg-slate-900 p-4 animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          {/* Clause type badge */}
          <div className="h-4 w-28 bg-slate-700 rounded-full mb-3" />
          {/* Summary lines */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-800 rounded" />
            <div className="h-3 w-5/6 bg-slate-800 rounded" />
            <div className="h-3 w-4/6 bg-slate-800 rounded" />
          </div>
          {/* Key terms row */}
          <div className="flex gap-2 mt-3">
            {[40, 52, 36].map((w) => (
              <div key={w} className={`h-5 w-${w <= 40 ? '16' : w <= 52 ? '20' : '14'} bg-slate-700/60 rounded-full`} />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading clause analysis…</span>
    </div>
  );
}
