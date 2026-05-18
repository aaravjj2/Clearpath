interface RiskGaugeProps {
  score: number;
}

export default function RiskGauge({ score }: RiskGaugeProps) {
  const ringColor = score > 66 ? "#ef4444" : score > 33 ? "#f59e0b" : "#22c55e";
  const percentage = Math.max(0, Math.min(100, score));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
      <svg width="42" height="42" viewBox="0 0 36 36" className="-rotate-90">
        <path d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31" fill="none" stroke="#1e293b" strokeWidth="3.5" />
        <path
          d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31"
          fill="none"
          stroke={ringColor}
          strokeWidth="3.5"
          strokeDasharray={`${percentage}, 100`}
        />
      </svg>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Risk score</p>
        <p className="text-lg font-bold leading-none">{percentage}/100</p>
      </div>
    </div>
  );
}
