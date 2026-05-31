import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchResult, PatternLibrary } from "@grokparse/core";
import type { BenchWorkerResult } from "../workers/benchmark.worker";

export function useBenchmarkWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<BenchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/benchmark.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current.onmessage = (ev: MessageEvent<BenchWorkerResult>) => {
      const data = ev.data;
      if (data.ok) {
        setResult(data.stats);
        setError(null);
      } else {
        setResult(null);
        setError(data.error);
      }
      setRunning(false);
    };
    return () => workerRef.current?.terminate();
  }, []);

  const run = useCallback(
    (
      grokPattern: string,
      corpus: string[],
      iterations: number,
      customPatterns?: PatternLibrary,
    ) => {
      setRunning(true);
      setError(null);
      workerRef.current?.postMessage({
        grokPattern,
        corpus,
        iterations: Math.max(1, iterations),
        customPatterns,
      });
    },
    [],
  );

  return { result, error, running, run };
}
