"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/api";
import { friendlyError } from "@/lib/errors";
import UploadZone from "@/components/UploadZone";
import { AlertTriangle, ArrowRight, FileText, Scale, Shield } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError("");
      try {
        const { document_id } = await uploadDocument(file);
        router.push(`/analyze/${document_id}`);
      } catch (err) {
        setError(friendlyError(err));
        setLoading(false);
      }
    },
    [router]
  );

  const handleText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { document_id } = await uploadDocument(undefined, text);
      router.push(`/analyze/${document_id}`);
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">ClearPath</span>
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-4">
          Understand what you&apos;re
          <br />
          <span className="text-blue-400">signing.</span>
        </h1>
        <p className="text-xl text-slate-400 mb-12 max-w-2xl">
          Upload any legal document — lease, contract, loan agreement — and get a plain-English breakdown in seconds. Free. No lawyers required.
        </p>

        <div className="flex gap-8 mb-12 flex-wrap">
          {[
            { icon: FileText, stat: "Any document", sub: "PDF, contract, ToS" },
            { icon: AlertTriangle, stat: "Auto red flags", sub: "Predatory clause detection" },
            { icon: Shield, stat: "Risk score", sub: "0–100 fairness rating" }
          ].map(({ icon: Icon, stat, sub }) => (
            <div key={stat} className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="font-semibold text-sm">{stat}</div>
                <div className="text-xs text-slate-500">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit">
            {(["upload", "paste"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {t === "upload" ? "Upload PDF" : "Paste Text"}
              </button>
            ))}
          </div>

          {tab === "upload" ? (
            <UploadZone disabled={loading} onFile={handleFile} />
          ) : (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim() && !loading) {
                    e.preventDefault();
                    handleText();
                  }
                }}
                placeholder="Paste your contract, lease, or any legal document text here..."
                aria-label="Paste legal document text"
                aria-describedby="paste-hint"
                maxLength={500000}
                className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
              />
              <div id="paste-hint" className="sr-only">Press Ctrl+Enter to analyze</div>
              <div className="flex items-center justify-between mt-1.5">
                <span
                  className={`text-xs tabular-nums ${
                    text.length > 450000
                      ? "text-red-400 font-semibold"
                      : text.length > 400000
                      ? "text-amber-400"
                      : "text-slate-600"
                  }`}
                  aria-live="polite"
                >
                  {text.length.toLocaleString()} / 500,000 characters
                </span>
              </div>
              <button
                onClick={handleText}
                disabled={!text.trim() || loading}
                className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-all"
              >
                Analyze document <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading && (
            <p className="text-center text-blue-400 mt-4 text-sm animate-pulse" aria-live="polite">
              Uploading and preparing analysis…
            </p>
          )}
          {error && (
            <p role="alert" className="text-center text-red-400 mt-4 text-sm flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="text-slate-500 text-sm mb-3">Try an example:</p>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                name: "Sample Lease Agreement",
                content: "1. Rent. Tenant shall pay Landlord rent in the amount of $1,500 per month.\n2. Maintenance. Tenant is responsible for all structural repairs.\n3. Early Termination. Tenant forfeits all deposits and owes remaining rent if they leave early."
              },
              {
                name: "Employment Contract",
                content: "1. Non-Compete. Employee agrees not to work for any competitor globally for 5 years after termination.\n2. At-Will. Employment may be terminated at any time without notice.\n3. IP Assignment. All intellectual property created by Employee at any time belongs to Employer."
              },
              {
                name: "Freelance Contract",
                content: "1. Payment. Client will pay Freelancer Net-90 days after invoice is received.\n2. Revisions. Unlimited revisions are included for the fixed price.\n3. Indemnity. Freelancer indemnifies Client against any and all claims."
              }
            ].map((ex) => (
              <button
                key={ex.name}
                onClick={() => {
                  setTab("paste");
                  setText(ex.content);
                }}
                className="text-xs border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-lg px-3 py-1.5 transition-all"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
