import { matchLine } from "./match.js";
import type { CompiledPattern } from "./types.js";

export interface DiffLineResult {
  line: string;
  index: number;
  patternA: boolean;
  patternB: boolean;
  changed: boolean;
}

export function diffPatterns(
  a: CompiledPattern,
  b: CompiledPattern,
  corpus: string[],
): DiffLineResult[] {
  return corpus.map((line, index) => {
    const ma = matchLine(a, line).matched;
    const mb = matchLine(b, line).matched;
    return {
      line,
      index,
      patternA: ma,
      patternB: mb,
      changed: ma !== mb,
    };
  });
}
