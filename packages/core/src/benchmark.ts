import { matchLine } from "./match.js";
import type { BenchResult, CompiledPattern } from "./types.js";

export function benchmark(
  compiled: CompiledPattern,
  corpus: string[],
  iterations = 10,
): BenchResult {
  const timings: number[] = [];
  let matchCount = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const start = performance.now();
    for (const line of corpus) {
      const result = matchLine(compiled, line);
      if (result.matched) matchCount++;
    }
    timings.push(performance.now() - start);
  }

  timings.sort((a, b) => a - b);
  const totalMs = timings.reduce((a, b) => a + b, 0);
  const p95Index = Math.min(
    timings.length - 1,
    Math.ceil(timings.length * 0.95) - 1,
  );

  const totalMatches = matchCount;
  const matchesPerSec =
    totalMs > 0 ? (totalMatches / totalMs) * 1000 : 0;

  return {
    iterations,
    totalMs,
    matchesPerSec,
    matchCount: totalMatches,
    lineCount: corpus.length * iterations,
    p95Ms: timings[p95Index] ?? 0,
  };
}

export function evalCorpusP95(
  compiled: CompiledPattern,
  corpus: string[],
  runs = 5,
): number {
  const timings: number[] = [];
  for (let r = 0; r < runs; r++) {
    const start = performance.now();
    for (const line of corpus) {
      matchLine(compiled, line);
    }
    timings.push(performance.now() - start);
  }
  timings.sort((a, b) => a - b);
  const idx = Math.min(timings.length - 1, Math.ceil(timings.length * 0.95) - 1);
  return timings[idx] ?? 0;
}
