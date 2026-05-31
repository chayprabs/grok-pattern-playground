import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { exportTo, validateExportSyntax } from "./export.js";
import { fullPatternLibrary } from "./patterns/standard.js";

describe("export validation", () => {
  const compiled = compile("%{IP:client:ip} %{WORD:verb}", fullPatternLibrary);
  const raw = "%{IP:client:ip} %{WORD:verb}";

  it.each([
    "logstash",
    "vector",
    "opensearch",
    "fluentbit",
    "javascript",
  ] as const)("validates %s export", (target) => {
    const content = exportTo(compiled, target, raw);
    expect(validateExportSyntax(target, content).valid).toBe(true);
  });
});
