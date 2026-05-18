// Custom 404 page for ClearPath
import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Search className="w-16 h-16 text-slate-600 mx-auto mb-6" aria-hidden="true" />
        <h1 className="text-5xl font-bold text-slate-700 mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-3">Page not found</h2>
        <p className="text-slate-400 mb-8">
          The document or page you were looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
        >
          Back to ClearPath
        </Link>
      </div>
    </main>
  );
}
