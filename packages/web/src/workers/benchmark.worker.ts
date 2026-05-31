import { compile, benchmark, fullPatternLibrary } from "@grokparse/core";

interface BenchMessage {
  grokPattern: string;
  corpus: string[];
  iterations: number;
}

self.onmessage = (ev: MessageEvent<BenchMessage>) => {
  const { grokPattern, corpus, iterations } = ev.data;
  try {
    const compiled = compile(grokPattern, fullPatternLibrary);
    const stats = benchmark(compiled, corpus, iterations);
    self.postMessage(stats);
  } catch {
    self.postMessage({
      iterations: 0,
      totalMs: 0,
      matchesPerSec: 0,
      matchCount: 0,
      lineCount: 0,
      p95Ms: 0,
    });
  }
};
