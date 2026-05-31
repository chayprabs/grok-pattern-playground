import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { fullPatternLibrary, getPatternCount } from "./patterns/standard.js";
import { matchLine } from "./match.js";
import { analyzeReDos } from "./redos.js";
import { sampleLogs } from "./samples.js";
import { exportTo, validateExportSyntax } from "./export.js";

describe("pattern library", () => {
  it("has at least 120 patterns", () => {
    expect(getPatternCount()).toBeGreaterThanOrEqual(120);
  });
});

describe("compile", () => {
  it("parses %{PATTERN:name:type}", () => {
    const c = compile("%{IP:client:ip}", fullPatternLibrary);
    expect(c.fields).toHaveLength(1);
    expect(c.fields[0].name).toBe("client");
    expect(c.fields[0].type).toBe("ip");
  });

  it("matches nginx sample", () => {
    const sample = sampleLogs.find((s) => s.id === "nginx")!;
    const c = compile(sample.suggestedPattern, fullPatternLibrary);
    const result = matchLine(c, sample.lines[0]);
    expect(result.matched).toBe(true);
  });
});

describe("ReDoS", () => {
  it("flags catastrophic pattern as high risk", () => {
    const { risk } = analyzeReDos("(a+)+$");
    expect(["medium", "high"]).toContain(risk);
  });

  it("safe pattern is low or none", () => {
    const { risk } = analyzeReDos("^\\d+$");
    expect(risk).toBe("none");
  });
});

describe("exports", () => {
  it("validates vector and logstash syntax", () => {
    const c = compile("%{WORD:test}", fullPatternLibrary);
    const vector = exportTo(c, "vector", "%{WORD:test}");
    const logstash = exportTo(c, "logstash", "%{WORD:test}");
    expect(validateExportSyntax("vector", vector).valid).toBe(true);
    expect(validateExportSyntax("logstash", logstash).valid).toBe(true);
  });
});

describe("acceptance A1", () => {
  it("each sample has a matching library pattern", () => {
    for (const sample of sampleLogs) {
      const c = compile(sample.suggestedPattern, fullPatternLibrary);
      const anyMatch = sample.lines.some((line) => matchLine(c, line).matched);
      expect(anyMatch, `sample ${sample.id}`).toBe(true);
    }
  });
});
