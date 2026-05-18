/**
 * Lightweight client-side analytics for ClearPath.
 * Fires to the backend /api/events endpoint when available.
 * Gracefully no-ops if the endpoint is not configured.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

type EventName =
  | "upload_started"
  | "upload_success"
  | "upload_error"
  | "analysis_complete"
  | "chat_message_sent"
  | "clause_expanded"
  | "copy_simplified_text"
  | "tab_changed"
  | "provider_key_added";

interface EventPayload {
  [key: string]: string | number | boolean | undefined;
}

export function track(event: EventName, payload?: EventPayload): void {
  if (!ENABLED) return;
  const body = { event, ts: Date.now(), ...payload };
  // Fire-and-forget; don't block UI
  fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {}); // silently ignore failures
}
