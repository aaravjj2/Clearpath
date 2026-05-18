interface RiskGaugeProps {
  score: number;
}

const riskLabel = (score: number) =>
  score > 66 ? "High risk" : score > 33 ? "Moderate risk" : "Low risk";

export default function RiskGauge({ score }: RiskGaugeProps) {
  const ringColor = score > 66 ? "#ef4444" : score > 33 ? "#f59e0b" : "#22c55e";
  const percentage = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 15.5;
  const dash = (percentage / 100) * circumference;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3"
      data-testid="risk-score"
    >
      <svg
        width="42"
        height="42"
        viewBox="0 0 36 36"
        className="-rotate-90"
        role="img"
        aria-label={`${riskLabel(percentage)}: ${percentage} out of 100`}
      >
        <title>{`Risk score: ${percentage}/100 — ${riskLabel(percentage)}`}</title>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={ringColor}
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide">Risk score</p>
        <p
          className="text-lg font-bold leading-none"
          aria-label={`${percentage} out of 100`}
        >
          {percentage}/100
        </p>
      </div>
    </div>
  );
}
