"use client";

import { Clause } from "@/types";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const SEVERITY_COLORS = {
  1: "border-amber-600 bg-amber-950/20",
  2: "border-orange-600 bg-orange-950/20",
  3: "border-red-600 bg-red-950/20"
} as const;

const SEVERITY_LABELS = {
  1: "Minor concern",
  2: "Review before signing",
  3: "Serious — seek legal advice"
} as const;

export default function ClauseCard({ clause }: { clause: Clause }) {
  const [expanded, setExpanded] = useState(false);
  const hasFlag = !!clause.red_flag;

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
            <span className="text-xs text-slate-500 uppercase tracking-wide">{clause.clause_type.replace("_", " ")}</span>
            {hasFlag && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${clause.red_flag!.severity === 3 ? "bg-red-900/50 text-red-300" : "bg-amber-900/50 text-amber-300"}`}>
                {SEVERITY_LABELS[clause.red_flag!.severity as 1 | 2 | 3]}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200">{clause.simplified_text}</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-4">
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
