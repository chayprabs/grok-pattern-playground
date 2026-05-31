export type ReDosRisk = "none" | "low" | "medium" | "high";

export interface PatternField {
  name: string;
  type?: string;
  subPattern: string;
}

export interface CompiledPattern {
  regex: RegExp;
  source: string;
  fields: PatternField[];
  reDosRisk: ReDosRisk;
  warnings: string[];
}

export interface CaptureValue {
  value: string;
  type: string;
}

export interface CaptureSpan {
  name: string;
  start: number;
  end: number;
  type: string;
}

export interface MatchResult {
  line: string;
  matched: boolean;
  partial?: boolean;
  captures: Record<string, CaptureValue>;
  captureSpans?: CaptureSpan[];
  divergencePosition?: number;
  matchLength?: number;
}

export interface BenchResult {
  iterations: number;
  totalMs: number;
  matchesPerSec: number;
  matchCount: number;
  lineCount: number;
  p95Ms: number;
}

export type ExportTarget =
  | "logstash"
  | "vector"
  | "opensearch"
  | "fluentbit"
  | "javascript";

export interface PatternDefinition {
  name: string;
  pattern: string;
  description?: string;
  example?: string;
}

export type PatternLibrary = Record<string, PatternDefinition>;
