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

  const addPattern = useCallback(
    (name: string, pattern: string, description?: string) => {
      setCustom((prev) => {
        const next = {
          ...prev,
          [name]: { name, pattern, description },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removePattern = useCallback(
    (name: string) => {
      setCustom((prev) => {
        const next = { ...prev };
        delete next[name];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCustom({});
  }, []);

  return { custom, addPattern, removePattern, clearAll };
}
