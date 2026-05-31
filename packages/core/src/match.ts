import { typedCaptures } from "./field-types.js";
import type { CompiledPattern, MatchResult } from "./types.js";

export function matchLine(
  compiled: CompiledPattern,
  line: string,
): MatchResult {
  const text = line ?? "";
  const exec = compiled.regex.exec(text);
  if (!exec) {
    const partial = partialMatch(compiled, text);
    return {
      line: text,
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
    line: text,
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
    const m = compiled.regex.exec(prefix);
    compiled.regex.lastIndex = 0;
    if (m && m.index === 0 && m[0].length > 0) {
      best = Math.max(best, m[0].length);
    } else if (m && m.index === 0 && m[0].length === 0 && i > 0) {
      best = Math.max(best, 0);
    }
    // Prefix consumed but line longer than match => partial at match end
    if (m && m.index === 0 && m[0].length < prefix.length && m[0].length > 0) {
      return {
        partial: true,
        matchLength: m[0].length,
        divergencePosition: m[0].length,
      };
    }
  }
  if (best > 0 && best < line.length) {
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
