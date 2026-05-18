"use client";

import { Clause } from "@/types";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useState } from "react";
import ClauseTypeIcon from "@/components/ClauseTypeIcon";
import SeverityBadge from "@/components/SeverityBadge";

const SEVERITY_COLORS = {
  1: "border-amber-600 bg-amber-950/20",
  2: "border-orange-600 bg-orange-950/20",
  3: "border-red-600 bg-red-950/20"
} as const;

export default function ClauseCard({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasFlag = !!clause.red_flag;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(clause.simplified_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`rounded-xl border transition-all ${hasFlag ? SEVERITY_COLORS[clause.red_flag!.severity as 1 | 2 | 3] : "border-slate-800 bg-slate-900"}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-start gap-3">
        {hasFlag && (
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              clause.red_flag!.severity === 3 ? "text-red-400" : clause.red_flag!.severity === 2 ? "text-orange-400" : "text-amber-400"
            }`}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ClauseTypeIcon type={clause.clause_type} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">{clause.clause_type.replace(/_/g, " ")}</span>
            {hasFlag && (
              <SeverityBadge severity={clause.red_flag!.severity} />
            )}
          </div>
          <p className="text-sm text-slate-200">{clause.simplified_text}</p>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy simplified explanation"
          className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
        >
          {copied
            ? <Check className="w-3.5 h-3.5 text-green-400" />
            : <Copy className="w-3.5 h-3.5" />}
        </button>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-4">
          {clause.key_terms.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase mb-1.5">Key terms</p>
              <div className="flex flex-wrap gap-1.5">
                {clause.key_terms.map((term) => (
                  <span
                    key={term}
                    className="text-xs bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 uppercase mb-2">Original clause</p>
          <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-800/50 rounded-lg p-3">{clause.original_text}</p>
          {hasFlag && (
            <div className="mt-3 space-y-2">
              <p className="text-xs">
                <span className="text-slate-400 font-medium">Why it matters: </span>
                <span className="text-slate-300">{clause.red_flag!.why_it_matters}</span>
              </p>
              <p className="text-xs">
                <span className="text-slate-400 font-medium">Ask: </span>
                <span className="text-blue-300 italic">{clause.red_flag!.what_to_ask}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
