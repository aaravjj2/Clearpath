/**
 * Simple CSS-only tooltip wrapper for ClearPath.
 */
"use client";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[200px] rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs text-slate-100 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 shadow-lg z-50 text-center"
      >
        {content}
      </span>
    </span>
  );
}
