import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { evalCorpusP95 } from "./benchmark.js";
import { fullPatternLibrary } from "./patterns/standard.js";

describe("performance budget", () => {
  it("evaluates 1000-line corpus with p95 under 50ms", () => {
    const line =
      '127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET / HTTP/1.1" 200 1234 "-" "curl"';
    const corpus = Array.from({ length: 1000 }, () => line);
    const compiled = compile("%{COMBINEDAPACHELOG}", fullPatternLibrary);
    const p95 = evalCorpusP95(compiled, corpus, 7);
    expect(p95).toBeLessThan(50);
  });
});
