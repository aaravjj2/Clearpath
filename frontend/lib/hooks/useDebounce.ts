/**
 * useDebounce — delay a value update until after `delay` ms have passed.
 * Prevents excessive API calls on rapid input changes.
 */
"use client";

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
