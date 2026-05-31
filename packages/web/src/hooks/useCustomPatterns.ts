import { useCallback, useEffect, useState } from "react";
import type { PatternDefinition } from "@grokparse/core";

const STORAGE_KEY = "grokparse-custom-patterns";

export function useCustomPatterns() {
  const [custom, setCustom] = useState<Record<string, PatternDefinition>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback((patterns: Record<string, PatternDefinition>) => {
    setCustom(patterns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }, []);

  const addPattern = useCallback(
    (name: string, pattern: string, description?: string) => {
      const next = {
        ...custom,
        [name]: { name, pattern, description },
      };
      save(next);
    },
    [custom, save],
  );

  const removePattern = useCallback(
    (name: string) => {
      const next = { ...custom };
      delete next[name];
      save(next);
    },
    [custom, save],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCustom({});
  }, []);

  return { custom, addPattern, removePattern, clearAll };
}
