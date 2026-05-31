import type { CaptureValue } from "./types.js";

const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?!$)|$)){4}$/;
const IPV6 =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::1)|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URI = /^https?:\/\/.+/i;
const MAC = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE =
  /^\d{4}[-/]\d{2}[-/]\d{2}$/;
const DATETIME =
  /^\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}/;

export function inferFieldType(value: string, hint?: string): string {
  if (hint) {
    const h = hint.toLowerCase();
    if (
      [
        "int",
        "float",
        "ip",
        "ipv4",
        "ipv6",
        "date",
        "datetime",
        "bool",
        "uri",
        "email",
        "mac",
        "uuid",
        "string",
      ].includes(h)
    ) {
      return h;
    }
  }

  const v = value.trim();
  if (v === "true" || v === "false") return "bool";
  if (/^-?\d+$/.test(v)) return "int";
  if (/^-?\d+\.\d+$/.test(v)) return "float";
  if (IPV4.test(v)) return "ipv4";
  if (IPV6.test(v)) return "ipv6";
  if (EMAIL.test(v)) return "email";
  if (URI.test(v)) return "uri";
  if (MAC.test(v)) return "mac";
  if (UUID.test(v)) return "uuid";
  if (DATETIME.test(v)) return "datetime";
  if (DATE.test(v)) return "date";
  if (IPV4.test(v) || /^[\d.]+$/.test(v) && v.includes(".")) return "ip";
  return "string";
}

export function typedCaptures(
  groups: Record<string, string | undefined>,
  fields: { name: string; type?: string }[],
): Record<string, CaptureValue> {
  const out: Record<string, CaptureValue> = {};
  for (const field of fields) {
    const raw = groups[field.name];
    if (raw === undefined) continue;
    out[field.name] = {
      value: raw,
      type: inferFieldType(raw, field.type),
    };
  }
  return out;
}
