import { typedCaptures } from "./field-types.js";
import type { CompiledPattern, MatchResult } from "./types.js";

export function matchLine(
  compiled: CompiledPattern,
  line: string,
): MatchResult {
  const exec = compiled.regex.exec(line);
  if (!exec) {
    const partial = partialMatch(compiled, line);
    return {
      line,
      matched: false,
      partial: partial.partial,
      captures: {},
      divergencePosition: partial.divergencePosition,
      matchLength: partial.matchLength,
    };
  }

  const groups = exec.groups ?? {};
  const captures = typedCaptures(
    Object.fromEntries(
      Object.entries(groups).map(([k, v]) => [k, v ?? ""]),
    ),
    compiled.fields,
  );

  return {
    line,
    matched: true,
    captures,
    matchLength: exec[0]?.length ?? 0,
  };
}

export function matchCorpus(
  compiled: CompiledPattern,
  lines: string[],
): MatchResult[] {
  return lines.map((line) => matchLine(compiled, line));
}

function partialMatch(
  compiled: CompiledPattern,
  line: string,
): { partial: boolean; divergencePosition?: number; matchLength?: number } {
  let best = 0;
  for (let i = 1; i <= line.length; i++) {
    const prefix = line.slice(0, i);
    if (compiled.regex.test(prefix)) {
      best = i;
    }
    compiled.regex.lastIndex = 0;
  }
  if (best > 0) {
    return {
      partial: true,
      matchLength: best,
      divergencePosition: best,
    };
  }
  return { partial: false, divergencePosition: 0, matchLength: 0 };
}

export function suggestFragments(failingPortion: string): string[] {
  const suggestions: string[] = [];
  const trimmed = failingPortion.trim();
  if (!trimmed) return suggestions;

  if (/^\d+$/.test(trimmed)) suggestions.push("%{NUMBER:name}", "%{INT:name}");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed))
    suggestions.push("%{IP:name}", "%{IPV4:name}");
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed))
    suggestions.push("%{TIMESTAMP_ISO8601:name}", "%{DATE:name}");
  if (/^[\w.-]+@[\w.-]+\.\w+/.test(trimmed))
    suggestions.push("%{EMAILADDRESS:name}");
  if (/^https?:\/\//.test(trimmed)) suggestions.push("%{URI:name}");
  if (/^[A-Z]+/.test(trimmed)) suggestions.push("%{WORD:name}");
  if (trimmed.includes(" ")) suggestions.push("%{DATA:name}", "%{GREEDYDATA:name}");

  if (suggestions.length === 0) {
    suggestions.push("%{DATA:name}", "%{NOTSPACE:name}");
  }
  return [...new Set(suggestions)];
}
