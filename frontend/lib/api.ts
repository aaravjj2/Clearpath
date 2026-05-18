import { ChatMessage, Clause, RiskScore } from "@/types";
import { parseApiError } from "@/lib/errors";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadDocument(file?: File, text?: string): Promise<{ document_id: string; filename: string }> {
  const form = new FormData();
  if (file) form.append("file", file);
  if (text) form.append("text", text);

  const res = await fetch(`${API_BASE}/api/documents/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await parseApiError(res);
    throw new Error(err.detail ?? err.message);
  }
  return res.json();
}

export function streamAnalysis(
  documentId: string,
  onClause: (clause: Clause, progress: number) => void,
  onRiskScore: (risk: RiskScore) => void,
  onComplete: () => void,
  onError: (err: string) => void
) {
  const es = new EventSource(`${API_BASE}/api/documents/${documentId}/stream`);

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "clause") onClause(data.clause, data.progress);
    else if (data.type === "risk_score") onRiskScore(data.risk_score);
    else if (data.type === "complete") {
      onComplete();
      es.close();
    } else if (data.type === "error") onError(data.message);
  };

  es.onerror = () => {
    onError("Stream connection lost");
    es.close();
  };

  return () => es.close();
}

export async function askQuestion(documentId: string, message: string, history: ChatMessage[]) {
  const res = await fetch(`${API_BASE}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, message, history })
  });
  if (!res.ok) {
    const err = await parseApiError(res);
    throw new Error(err.detail ?? err.message);
  }
  return res.json() as Promise<{ answer: string; cited_clause_id?: string }>;
}
