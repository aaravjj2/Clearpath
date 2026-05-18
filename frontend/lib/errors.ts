/**
 * Typed API error handling utilities for ClearPath frontend.
 */

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Parse a fetch Response into an ApiError.
 * Tries to read JSON `detail` field (FastAPI default), falls back to statusText.
 */
export async function parseApiError(res: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = await res.json();
    detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
  } catch {
    detail = res.statusText;
  }
  return {
    status: res.status,
    message: httpStatusMessage(res.status),
    detail,
  };
}

function httpStatusMessage(status: number): string {
  switch (status) {
    case 400: return "Bad request";
    case 404: return "Not found";
    case 413: return "File too large";
    case 415: return "Unsupported file type";
    case 429: return "Too many requests — please wait a moment";
    case 500: return "Server error";
    case 503: return "Service unavailable";
    default:  return `Request failed (${status})`;
  }
}

/**
 * Friendly user-facing string from an ApiError or unknown caught value.
 */
export function friendlyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return (err as ApiError).message + (("detail" in err && (err as ApiError).detail) ? `: ${(err as ApiError).detail}` : "");
  }
  return "An unexpected error occurred.";
}
