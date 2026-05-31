export type ShareEngine =
  | "logstash"
  | "vector"
  | "opensearch"
  | "fluentbit"
  | "javascript";

export interface ShareState {
  pattern: string;
  corpus: string;
  mode: "single" | "diff";
  patternB?: string;
  engine?: ShareEngine;
}

export function encodeShare(state: ShareState): string {
  const payload = JSON.stringify(state);
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#${encoded}`;
}

function extractSharePayload(input: string): string {
  const trimmed = input.trim();
  const hashIdx = trimmed.lastIndexOf("#");
  if (hashIdx >= 0) return trimmed.slice(hashIdx + 1);
  return trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
}

export function decodeShare(hash: string): ShareState | null {
  try {
    const raw = extractSharePayload(hash);
    if (!raw) return null;
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json) as ShareState;
  } catch {
    return null;
  }
}
