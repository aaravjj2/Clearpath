// Analyze route loading skeleton
export default function AnalyzeLoading() {
  return (
    <div
      className="min-h-screen bg-slate-950 text-white"
      role="status"
      aria-label="Loading document analysis…"
    >
      <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded mb-8" />
        <div className="h-2 w-full bg-slate-800 rounded-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-slate-800/50 rounded-xl" />
            <div className="h-32 bg-slate-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
