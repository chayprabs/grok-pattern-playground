import {
  fullPatternLibrary,
  mergeLibraries,
  type PatternLibrary,
} from "@grokparse/core";

export function buildLibrary(
  custom: PatternLibrary = {},
): PatternLibrary {
  return mergeLibraries(fullPatternLibrary, custom);
}
