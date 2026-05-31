import type { CompiledPattern, ExportTarget } from "./types.js";

function fieldList(compiled: CompiledPattern): string {
  return compiled.fields.map((f) => f.name).join(", ");
}

export function exportTo(
  compiled: CompiledPattern,
  target: ExportTarget,
  patternRaw?: string,
): string {
  const raw = patternRaw ?? "";
  const fields = compiled.fields.map((f) => f.name);

  switch (target) {
    case "logstash":
      return `filter {
  grok {
    match => { "message" => "${escapeLogstash(raw)}" }
    tag_on_failure => ["_grokparsefailure"]
  }
}`;
    case "vector":
      return `[transforms.grok_parse]
type = "remap"
inputs = ["your_source"]
source = '''
. = parse_grok!(.message, pattern: "${escapeToml(raw)}")
'''`;
    case "opensearch":
      return JSON.stringify(
        {
          description: "GrokParse exported ingest pipeline",
          processors: [
            {
              grok: {
                field: "message",
                patterns: [raw],
              },
            },
          ],
        },
        null,
        2,
      );
    case "fluentbit": {
      const timeField = fields.find((f) =>
        /time|date|timestamp/i.test(f),
      );
      const timeLines = timeField
        ? `    Time_Key    ${timeField}\n    Time_Format %Y-%m-%dT%H:%M:%S.%L\n`
        : "";
      return `# Grok pattern (use with a grok parser plugin or convert to PCRE)
# Pattern: ${raw}
[PARSER]
    Name        grok_parse
    Format      regex
    Regex       ${compiled.source.replace(/\(\?<([^>]+)>/g, "(?P<$1>")}
${timeLines}`.trimEnd();
    }
    case "javascript":
      return `const pattern = ${compiled.regex.toString()};
// Named fields: ${fieldList(compiled)}
export function parseLine(line) {
  const m = pattern.exec(line);
  return m?.groups ?? null;
}`;
    default:
      throw new Error(`Unknown export target: ${target}`);
  }
}

function escapeLogstash(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function escapeToml(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function validateExportSyntax(
  target: ExportTarget,
  content: string,
): { valid: boolean; message: string } {
  switch (target) {
    case "opensearch":
      try {
        JSON.parse(content);
        return { valid: true, message: "Valid JSON" };
      } catch (e) {
        return {
          valid: false,
          message: e instanceof Error ? e.message : "Invalid JSON",
        };
      }
    case "vector":
      if (content.includes("[transforms.") && content.includes("remap")) {
        return { valid: true, message: "Vector TOML structure OK" };
      }
      return { valid: false, message: "Missing Vector transform block" };
    case "logstash":
      if (
        content.includes("filter {") &&
        content.includes("grok {") &&
        content.includes("match =>") &&
        content.includes("tag_on_failure")
      ) {
        return { valid: true, message: "Logstash filter block present" };
      }
      return { valid: false, message: "Missing complete Logstash filter block" };
    case "fluentbit":
      if (content.includes("[PARSER]") && content.includes("Regex")) {
        return { valid: true, message: "Fluent Bit parser block present" };
      }
      return { valid: false, message: "Missing Fluent Bit parser section" };
    case "javascript":
      if (content.includes("const pattern")) {
        return { valid: true, message: "JavaScript export OK" };
      }
      return { valid: false, message: "Invalid JS export" };
    default:
      return { valid: false, message: "Unknown target" };
  }
}
