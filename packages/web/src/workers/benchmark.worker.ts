import {
  benchmark,
  compile,
  fullPatternLibrary,
  mergeLibraries,
  type PatternLibrary,
} from "@grokparse/core";

interface BenchMessage {
  grokPattern: string;
  corpus: string[];
  iterations: number;
  customPatterns?: PatternLibrary;
}

export type BenchWorkerResult =
  | { ok: true; stats: ReturnType<typeof benchmark> }
  | { ok: false; error: string };

self.onmessage = (ev: MessageEvent<BenchMessage>) => {
  const { grokPattern, corpus, iterations, customPatterns } = ev.data;
  const lib = mergeLibraries(fullPatternLibrary, customPatterns ?? {});
  const iters = Math.max(1, iterations);

  try {
    const compiled = compile(grokPattern, lib);
    const stats = benchmark(compiled, corpus, iters);
    self.postMessage({ ok: true, stats } satisfies BenchWorkerResult);
  } catch (e) {
    self.postMessage({
      ok: false,
      error: e instanceof Error ? e.message : "Benchmark failed",
    } satisfies BenchWorkerResult);
  }
};
