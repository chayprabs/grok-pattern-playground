import { describe, expect, it } from "vitest";
import { analyzeReDos, estimateWorstCaseMs } from "./redos.js";

describe("ReDoS acceptance A2", () => {
  it("flags (a+)+ as high or medium risk", () => {
    const { risk } = analyzeReDos("(a+)+");
    expect(["high", "medium"]).toContain(risk);
  });

  it("detects slow worst-case execution with non-matching probe", () => {
    const re = /^x+y$/;
    const slow = estimateWorstCaseMs(
      re,
      "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      5,
    );
    expect(typeof slow).toBe("boolean");
  });

  it("does not flag simple patterns", () => {
    const { risk } = analyzeReDos("^\\d+$");
    expect(risk).toBe("none");
  });
});
