/**
 * Accessible progress bar component for document analysis streaming.
 */
interface ProgressBarProps {
  /** 0–1 progress value */
  value: number;
  /** Whether analysis is complete */
  complete: boolean;
}

export default function ProgressBar({ value, complete }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  if (complete) return null;

  return (
    <div className="mb-8">
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Analysis progress: ${pct}%`}
        className="h-1.5 bg-slate-800 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-slate-600 mt-1" aria-hidden="true">
        {pct}%
      </p>
    </div>
  );
}
