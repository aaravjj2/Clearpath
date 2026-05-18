"use client";
// Next.js App Router global error boundary

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 mb-6 text-sm">
            {error.message || "An unexpected error occurred. Our team has been notified."}
          </p>
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all mr-3"
          >
            Try again
          </button>
          <a
            href="/"
            className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
