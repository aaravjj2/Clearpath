/**
 * Top navigation bar for ClearPath.
 */
"use client";

import Link from "next/link";
import { Scale } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-bold text-lg hover:opacity-80 transition-opacity"
          aria-label="ClearPath home"
        >
          <Scale className="w-5 h-5 text-blue-400" aria-hidden="true" />
          ClearPath
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/clearpath"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
