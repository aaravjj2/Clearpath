/**
 * Shared constants for the ClearPath frontend.
 * Single source of truth — matches backend limits.
 */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;     // 20 MB
export const MAX_TEXT_CHARS = 500_000;               // 500k chars
export const MAX_CHAT_MESSAGE_LENGTH = 2_000;        // chars
export const MAX_CHAT_HISTORY_TURNS = 20;            // conversation turns
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const SEVERITY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Minor concern",
  2: "Review before signing",
  3: "Seek legal advice",
};

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  payment: "Payment",
  termination: "Termination",
  liability: "Liability",
  privacy: "Privacy",
  non_compete: "Non-Compete",
  intellectual_property: "Intellectual Property",
  dispute_resolution: "Dispute Resolution",
  renewal: "Renewal",
  general: "General",
};
