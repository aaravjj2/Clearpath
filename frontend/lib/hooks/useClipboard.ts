/**
 * useClipboard — copy text to clipboard with a transient success state.
 */
"use client";

import { useState } from "react";

export function useClipboard(timeout = 1500): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch {
      // Clipboard access denied; silently ignore
    }
  };

  return [copied, copy];
}
