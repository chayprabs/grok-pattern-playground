import { describe, expect, it } from "vitest";
import { compile, matchLine, fullPatternLibrary } from "./index.js";
import { inferFieldType } from "./field-types.js";
import { analyzeReDos } from "./redos.js";

describe("regression fixes", () => {
  it("captures full IPv4-mapped IPv6 address", () => {
    const c = compile("%{IP:host:ip}", fullPatternLibrary);
    const r = matchLine(c, "::ffff:192.0.2.1");
    expect(r.matched).toBe(true);
    expect(r.captures.host.value).toBe("::ffff:192.0.2.1");
  });

  it("infers ipv6 for IPv4-mapped address", () => {
    expect(inferFieldType("::ffff:192.0.2.1")).toBe("ipv6");
  });

  it("does not classify invalid dotted numbers as ip", () => {
    expect(inferFieldType("999.999.999.999")).toBe("string");
    expect(inferFieldType("256.1.1.1")).toBe("string");
  });

  it("does not flag NUMBER pattern as high ReDoS", () => {
    const c = compile("%{NUMBER:x}", fullPatternLibrary);
    expect(c.reDosRisk).not.toBe("high");
  });

  it("still flags catastrophic pattern as high", () => {
    const { risk } = analyzeReDos("(a+)+b");
    expect(risk).toBe("high");
  });

  it("PROG allows slash in program names", () => {
    const c = compile("%{PROG:program}", fullPatternLibrary);
    expect(matchLine(c, "postfix/smtp").matched).toBe(true);
  });

  it("HOSTNAME rejects invalid all-numeric dotted string", () => {
    const c = compile("^%{HOSTNAME:host}$", fullPatternLibrary);
    expect(matchLine(c, "999.999.999.999").matched).toBe(false);
  });

  it("CLOUDTRAIL requires full-line JSON", () => {
    const c = compile("%{CLOUDTRAIL}", fullPatternLibrary);
    expect(
      matchLine(c, 'prefix {"eventTime":"2023-01-01T00:00:00Z"} suffix').matched,
    ).toBe(false);
    expect(
      matchLine(c, '{"eventTime":"2023-01-01T00:00:00Z"}').matched,
    ).toBe(true);
  });

  it("JAVA_CLASS requires package segments", () => {
    const c = compile("%{JAVA_CLASS:class}", fullPatternLibrary);
    expect(matchLine(c, "Exception in thread").matched).toBe(false);
    expect(matchLine(c, "com.example.App").matched).toBe(true);
  });
});
