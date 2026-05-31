export interface ShareState {
  pattern: string;
  corpus: string;
  mode: "single" | "diff";
  patternB?: string;
  engine?: string;
}

export function encodeShare(state: ShareState): string {
  const payload = JSON.stringify(state);
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#${encoded}`;
}

export function decodeShare(hash: string): ShareState | null {
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!raw) return null;
    const json = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(json) as ShareState;
  } catch {
    return null;
  }
}
