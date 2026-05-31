import { describe, expect, it } from "vitest";
import { compile } from "../compile.js";
import { fullPatternLibrary } from "./standard.js";

describe("pattern library fixtures", () => {
  const names = Object.keys(fullPatternLibrary);

  it.each(names)("compiles pattern %{name}", (name) => {
    expect(() => compile(`%{${name}:field}`, fullPatternLibrary)).not.toThrow();
  });

  it("has 100+ named patterns", () => {
    expect(names.length).toBeGreaterThanOrEqual(100);
  });
});
