import safeRegex from "safe-regex";
import type { ReDosRisk } from "./types.js";

const CATASTROPHIC_PATTERNS = [
  /(\w+\*)+/,
  /(\.\*)+/,
  /(\([^)]*\+[^)]*\))+/,
  /(a+)+/,
  /(x+)+y/,
  /\([^)]*\|[^)]*\)\+/,
];

export function analyzeReDos(source: string): {
  risk: ReDosRisk;
  warnings: string[];
} {
  const warnings: string[] = [];
  let risk: ReDosRisk = "none";

  if (!safeRegex(source)) {
    risk = "high";
    warnings.push("Pattern failed safe-regex check (possible catastrophic backtracking).");
  }

  for (const catastrophic of CATASTROPHIC_PATTERNS) {
    if (catastrophic.test(source)) {
      if (risk !== "high") risk = "medium";
      warnings.push("Nested quantifiers or alternation with quantifiers detected.");
      break;
    }
  }

  if (/\(\?[^)]*\+/.test(source) || /\([^)]*\)\{[2-9]/.test(source)) {
    if (risk === "none") risk = "low";
    warnings.push("Repeated groups may increase backtracking cost.");
  }

  if (source.length > 500) {
    if (risk === "none") risk = "low";
    warnings.push("Very long regex may be slow on large corpora.");
  }

  return { risk, warnings };
}

export function estimateWorstCaseMs(regex: RegExp, sample: string, limitMs = 100): boolean {
  const start = performance.now();
  try {
    regex.test(sample.repeat(50));
  } catch {
    return true;
  }
  return performance.now() - start > limitMs;
}
