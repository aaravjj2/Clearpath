"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { streamAnalysis } from "@/lib/api";
import { Clause, RiskScore } from "@/types";
import ClauseCard from "@/components/ClauseCard";
import RedFlagPanel from "@/components/RedFlagPanel";
import RiskGauge from "@/components/RiskGauge";
import ChatPanel from "@/components/ChatPanel";
import StreamingLoader from "@/components/StreamingLoader";
import { AlertTriangle, FileText, MessageSquare, Shield } from "lucide-react";

type Tab = "clauses" | "redflags" | "chat";

export default function AnalyzePage() {
  const { docId } = useParams<{ docId: string }>();
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [tab, setTab] = useState<Tab>("redflags");

  useEffect(() => {
    const cleanup = streamAnalysis(
      docId,
      (clause, prog) => {
        setClauses((prev) => [...prev, clause]);
        setProgress(prog);
      },
      setRiskScore,
      () => setComplete(true),
      (err) => console.error(err)
    );
    return () => cleanup();
  }, [docId]);

  const redFlags = clauses.filter((c) => c.red_flag !== null);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Document Analysis</h1>
            <p className="text-slate-400 text-sm mt-1">{complete ? `${clauses.length} clauses analyzed` : `Analyzing… ${Math.round(progress * 100)}%`}</p>
          </div>
          {riskScore && <RiskGauge score={riskScore.overall} />}
        </div>

        {!complete && (
          <div className="mb-8">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-slate-900 rounded-xl p-1 w-fit border border-slate-800">
          {([
            { id: "redflags", label: "Red Flags", icon: AlertTriangle, count: redFlags.length, color: redFlags.length > 0 ? "text-red-400" : "" },
            { id: "clauses", label: "All Clauses", icon: FileText, count: clauses.length, color: "" },
            { id: "chat", label: "Ask Questions", icon: MessageSquare, count: null, color: "" }
          ] as const).map(({ id, label, icon: Icon, count, color }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"}`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
              {count !== null && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${id === "redflags" && count > 0 ? "bg-red-900 text-red-300" : "bg-slate-700 text-slate-400"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {tab === "redflags" && <RedFlagPanel clauses={redFlags} loading={!complete} />}
            {tab === "clauses" && (
              <div className="space-y-3">
                {clauses.length === 0 && !complete && <StreamingLoader />}
                {clauses.map((clause) => (
                  <ClauseCard key={clause.id} clause={clause} />
                ))}
              </div>
            )}
            {tab === "chat" && <ChatPanel documentId={docId} disabled={!complete} />}
          </div>

          <div className="space-y-4">
            {riskScore && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" /> Risk Breakdown
                </h3>
                {riskScore.categories.map((cat) => (
                  <div key={cat.label} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.label}</span>
                      <span className={`font-bold ${cat.score > 66 ? "text-red-400" : cat.score > 33 ? "text-amber-400" : "text-green-400"}`}>{cat.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cat.score > 66 ? "bg-red-500" : cat.score > 33 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{cat.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
