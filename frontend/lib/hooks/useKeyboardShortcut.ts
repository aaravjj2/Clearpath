/**
 * useKeyboardShortcut — attach a global keyboard shortcut handler.
 *
 * @param key  - Key to listen for (e.g. "k", "Escape")
 * @param cb   - Callback to invoke
 * @param opts - Optional modifiers: ctrl, meta, shift
 */
"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  cb: (e: KeyboardEvent) => void,
  { ctrl = false, meta = false, shift = false, enabled = true }: ShortcutOptions = {}
): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === key &&
        (!ctrl || e.ctrlKey) &&
        (!meta || e.metaKey) &&
        (!shift || e.shiftKey)
      ) {
        cb(e);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, cb, ctrl, meta, shift, enabled]);
}
