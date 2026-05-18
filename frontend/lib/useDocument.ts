/**
 * Custom hook for fetching a document summary by ID.
 * Centralises the fetch + error state used in multiple components.
 */

"use client";

import { useEffect, useState } from "react";
import { DocumentAnalysis } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UseDocumentResult {
  data: DocumentAnalysis | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDocument(documentId: string): UseDocumentResult {
  const [data, setData] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/documents/${documentId}/summary`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DocumentAnalysis>;
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [documentId, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}
