/**
 * SSE streaming client for ClearPath document analysis.
 * Returns a cleanup function that closes the EventSource.
 */

import { Clause, RiskScore } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface StreamCallbacks {
  onClause?: (clause: Clause) => void;
  onRisk?: (risk: RiskScore) => void;
  onProgress?: (value: number) => void;
  onError?: (message: string) => void;
  onComplete?: () => void;
}

export function streamAnalysis(
  documentId: string,
  callbacks: StreamCallbacks,
): () => void {
  const url = `${API_BASE}/api/documents/${documentId}/stream`;
  const es = new EventSource(url);
  let closed = false;

  const close = () => {
    if (!closed) {
      closed = true;
      es.close();
    }
  };

  es.onmessage = (e: MessageEvent) => {
    if (!e.data || e.data.trim() === "") return;
    try {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case "clause":
          callbacks.onClause?.(data.clause as Clause);
          callbacks.onProgress?.(data.progress ?? 0);
          break;
        case "risk_score":
          callbacks.onRisk?.(data.risk_score as RiskScore);
          break;
        case "complete":
          callbacks.onComplete?.();
          close();
          break;
        case "error":
          callbacks.onError?.(data.message ?? "Stream error");
          close();
          break;
      }
    } catch {
      // Non-JSON event (e.g. keepalive comment) — ignore
    }
  };

  es.onerror = () => {
    if (!closed) {
      callbacks.onError?.("Connection lost. Please refresh.");
      close();
    }
  };

  return close;
}
