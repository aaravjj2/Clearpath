/**
 * Severity badge for red flag clauses.
 * Severity: 1=minor, 2=moderate, 3=serious
 */
import { RedFlagSeverity } from "@/types";

const CONFIG: Record<
  1 | 2 | 3,
  { label: string; className: string }
> = {
  1: { label: "Minor concern", className: "bg-amber-900/50 text-amber-300 border-amber-700" },
  2: { label: "Review before signing", className: "bg-orange-900/50 text-orange-300 border-orange-700" },
  3: { label: "Seek legal advice", className: "bg-red-900/50 text-red-300 border-red-700" },
};

interface SeverityBadgeProps {
  severity: RedFlagSeverity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (!severity || severity < 1) return null;
  const cfg = CONFIG[severity as 1 | 2 | 3];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${cfg.className}`}
      aria-label={`Severity: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
}
