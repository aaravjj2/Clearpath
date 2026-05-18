// Global loading skeleton for Next.js App Router page transitions.
export default function GlobalLoading() {
  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center"
      role="status"
      aria-label="Loading…"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading…</span>
      </div>
    </div>
  );
}
