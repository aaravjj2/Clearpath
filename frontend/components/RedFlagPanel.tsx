import { Clause } from "@/types";
import ClauseCard from "@/components/ClauseCard";
import StreamingLoader from "@/components/StreamingLoader";
import { AlertTriangle } from "lucide-react";

interface RedFlagPanelProps {
  clauses: Clause[];
  loading: boolean;
}

export default function RedFlagPanel({ clauses, loading }: RedFlagPanelProps) {
  if (loading && clauses.length === 0) {
    return <StreamingLoader />;
  }

  if (clauses.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-green-400 mx-auto mb-3" />
        <p className="font-medium text-slate-200">No red flags detected</p>
        <p className="text-sm text-slate-500 mt-1">This does not replace legal advice, but there are no obvious high-risk clauses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clauses.map((clause) => (
        <ClauseCard key={clause.id} clause={clause} />
      ))}
    </div>
  );
}
