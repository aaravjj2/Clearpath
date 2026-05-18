export default function StreamingLoader() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-4 animate-pulse">
          <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
          <div className="h-3 w-full bg-slate-800 rounded mb-2" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}
