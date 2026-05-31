import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchResult } from "@grokparse/core";

export function useBenchmarkWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<BenchResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/benchmark.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current.onmessage = (ev: MessageEvent<BenchResult>) => {
      setResult(ev.data);
      setRunning(false);
    };
    return () => workerRef.current?.terminate();
  }, []);

  const run = useCallback(
    (grokPattern: string, corpus: string[], iterations: number) => {
      setRunning(true);
      workerRef.current?.postMessage({ grokPattern, corpus, iterations });
    },
    [],
  );

  return { result, running, run };
}
