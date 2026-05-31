import { describe, expect, it } from "vitest";
import { decodeShare, encodeShare } from "./share.js";

describe("decodeShare", () => {
  it("round-trips via hash only", () => {
    const state = {
      pattern: "%{WORD:a}",
      corpus: "hello",
      mode: "single" as const,
    };
    const url = encodeShare(state);
    const hash = url.split("#")[1] ?? "";
    expect(decodeShare(`#${hash}`)).toEqual(state);
  });

  it("decodes full pasted URL", () => {
    const state = {
      pattern: "%{IP:host}",
      corpus: "1.2.3.4",
      mode: "single" as const,
      engine: "vector" as const,
    };
    const url = encodeShare(state);
    expect(decodeShare(url)).toEqual(state);
    expect(decodeShare(`  ${url}  `)).toEqual(state);
  });
});
