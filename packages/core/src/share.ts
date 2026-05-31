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

function toBase64Url(json: string): string {
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(encoded: string): string {
  const pad = (4 - (encoded.length % 4)) % 4;
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  if (typeof atob !== "undefined") {
    return decodeURIComponent(escape(atob(b64)));
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

export function encodeShare(state: ShareState): string {
  const payload = JSON.stringify(state);
  const encoded = toBase64Url(payload);
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
    const json = fromBase64Url(raw);
    return JSON.parse(json) as ShareState;
  } catch {
    return null;
  }
}
