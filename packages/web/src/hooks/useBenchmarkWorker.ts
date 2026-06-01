import { useCallback, useEffect, useRef, useState } from "react";
import type { BenchResult, PatternLibrary } from "@grokparse/core";
import type { BenchWorkerResult } from "../workers/benchmark.worker";

interface BenchMessage {
  grokPattern: string;
  corpus: string[];
  iterations: number;
  customPatterns?: PatternLibrary;
}

export function useBenchmarkWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<BenchMessage | null>(null);
  const [result, setResult] = useState<BenchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const postToWorker = useCallback((msg: BenchMessage) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
      return;
    }
    pendingRef.current = msg;
  }, []);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/benchmark.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    worker.onmessage = (ev: MessageEvent<BenchWorkerResult>) => {
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
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      worker.postMessage(pending);
    }
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
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
      postToWorker({
        grokPattern,
        corpus,
        iterations: Math.max(1, iterations),
        customPatterns,
      });
    },
    [postToWorker],
  );

  return { result, error, running, run };
}
