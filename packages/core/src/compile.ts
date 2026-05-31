import { analyzeReDos } from "./redos.js";
import type {
  CompiledPattern,
  PatternDefinition,
  PatternField,
  PatternLibrary,
} from "./types.js";

const GROK_TOKEN =
  /%\{([A-Z0-9_]+)(?::([a-zA-Z0-9_]+))?(?::([a-zA-Z0-9_]+))?\}/g;

const MAX_EXPANSION_DEPTH = 32;

function escapeRegexLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandPattern(
  name: string,
  lib: PatternLibrary,
  stack: Set<string>,
  depth: number,
): string {
  if (depth > MAX_EXPANSION_DEPTH) {
    throw new Error(`Pattern expansion depth exceeded for ${name}`);
  }
  if (stack.has(name)) {
    throw new Error(`Circular pattern reference: ${name}`);
  }
  const def = lib[name];
  if (!def) {
    throw new Error(`Unknown grok pattern: ${name}`);
  }
  stack.add(name);
  let expanded = def.pattern;
  expanded = expanded.replace(GROK_TOKEN, (_, pat, field, type) => {
    const inner = expandPattern(pat, lib, stack, depth + 1);
    if (field) {
      const typeSuffix = type ? `:${type}` : "";
      return `(?<${field}>${inner})`;
    }
    return inner;
  });
  stack.delete(name);
  return expanded;
}

export function compile(
  pattern: string,
  lib: PatternLibrary,
): CompiledPattern {
  if (!pattern.trim()) {
    throw new Error("Pattern cannot be empty");
  }
  if (/%\{[^}]*$/.test(pattern) || /%\{[^:}]+:\s*\}/.test(pattern)) {
    throw new Error("Malformed grok token in pattern");
  }
  const fields: PatternField[] = [];
  let depth = 0;

  const source = pattern.replace(
    GROK_TOKEN,
    (_, pat: string, field?: string, type?: string) => {
      const inner = expandPattern(pat, lib, new Set(), 0);
      if (field) {
        fields.push({
          name: field,
          type,
          subPattern: pat,
        });
        return `(?<${field}>${inner})`;
      }
      return inner;
    },
  );

  if (/%\{/.test(source)) {
    throw new Error("Unresolved grok tokens remain after expansion");
  }

  let regex: RegExp;
  try {
    regex = new RegExp(source);
  } catch (e) {
    throw new Error(
      `Invalid regex after grok expansion: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const { risk, warnings } = analyzeReDos(regex.source);
  return {
    regex,
    source: regex.source,
    fields,
    reDosRisk: risk,
    warnings,
  };
}

export function mergeLibraries(
  ...libs: PatternLibrary[]
): PatternLibrary {
  return Object.assign({}, ...libs);
}

export function definePattern(
  name: string,
  pattern: string,
  meta?: Omit<PatternDefinition, "name" | "pattern">,
): PatternDefinition {
  return { name, pattern, ...meta };
}
