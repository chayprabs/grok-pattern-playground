#!/usr/bin/env node
/**
 * Comprehensive GrokParse core verification — gaps beyond vitest.
 */
import {
  compile,
  mergeLibraries,
  definePattern,
  matchLine,
  matchCorpus,
  inferFieldType,
  sampleLogs,
  exportTo,
  validateExportSyntax,
  benchmark,
  evalCorpusP95,
  diffPatterns,
  encodeShare,
  decodeShare,
  analyzeReDos,
  fullPatternLibrary,
} from "../dist/index.js";

const bugs = [];

function bug(file, repro, expected, actual) {
  bugs.push({ file, repro, expected, actual });
}

function assert(name, condition, file, repro, expected, actual) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    bug(file, repro, expected, actual);
    return false;
  }
  console.log(`OK: ${name}`);
  return true;
}

function throws(fn, msg) {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof Error && e.message.includes(msg);
  }
}

console.log("\n=== 1. compile() ===");
const typed = compile("%{IP:client:ip} %{WORD:verb:string}", fullPatternLibrary);
assert(
  "compile typed fields",
  typed.fields.length === 2 && typed.fields[0].type === "ip",
  "src/compile.ts",
  'compile("%{IP:client:ip} %{WORD:verb:string}")',
  "2 fields, client type ip",
  JSON.stringify(typed.fields),
);

const nestedLib = mergeLibraries(fullPatternLibrary, {
  MYHOST: definePattern("MYHOST", "%{IP:addr:ip}:%{NUMBER:port:int}"),
});
assert(
  "unwrapped composite exposes inner fields",
  compile("%{MYHOST}", nestedLib).fields.map((f) => f.name).join(",") === "addr,port",
  "src/compile.ts",
  "compile('%{MYHOST}') fields",
  "addr,port",
  compile("%{MYHOST}", nestedLib).fields.map((f) => f.name).join(","),
);

const customLib = mergeLibraries(fullPatternLibrary, {
  GREET: definePattern("GREET", "Hello %{WORD:name}"),
});
assert(
  "custom library merge",
  matchLine(compile("%{GREET:msg}", customLib), "Hello world").matched,
  "src/compile.ts",
  "mergeLibraries + GREET",
  "matched",
  "false",
);

console.log("\n=== 2. matchLine / matchCorpus ===");
const simple = compile("%{WORD:a} %{WORD:b}", fullPatternLibrary);
assert(
  "full match",
  matchLine(simple, "foo bar").matched,
  "src/match.ts",
  'matchLine("%{WORD:a} %{WORD:b}", "foo bar")',
  "matched=true",
  String(matchLine(simple, "foo bar").matched),
);

const anchoredPartial = compile("^foobar$", fullPatternLibrary);
const partialRes = matchLine(anchoredPartial, "foobars");
assert(
  "partial match (anchored suffix overflow)",
  !partialRes.matched && partialRes.partial === true,
  "src/match.ts",
  'matchLine("^foobar$", "foobars")',
  "matched=false, partial=true",
  JSON.stringify({ matched: partialRes.matched, partial: partialRes.partial }),
);

assert(
  "no match",
  !matchLine(simple, "!!!").matched,
  "src/match.ts",
  'matchLine("%{WORD:a} %{WORD:b}", "!!!")',
  "matched=false",
  "true",
);

assert(
  "matchCorpus",
  matchCorpus(simple, ["foo bar", "!!!"]).length === 2,
  "src/match.ts",
  "matchCorpus 2 lines",
  "length 2",
  String(matchCorpus(simple, ["foo bar", "!!!"]).length),
);

console.log("\n=== 3. Field inference ===");
const inferenceCases = [
  ["42", "int"],
  ["3.14", "float"],
  ["192.168.0.1", "ipv4"],
  ["::1", "ipv6"],
  ["2023-10-10", "date"],
  ["2023-10-10T12:00:00", "datetime"],
  ["true", "bool"],
  ["https://x.com", "uri"],
  ["user@example.com", "email"],
  ["aa:bb:cc:dd:ee:ff", "mac"],
  ["550e8400-e29b-41d4-a716-446655440000", "uuid"],
  ["hello", "string"],
];
for (const [value, expectedType] of inferenceCases) {
  assert(
    `inferFieldType(${value})`,
    inferFieldType(value) === expectedType,
    "src/field-types.ts",
    `inferFieldType(${JSON.stringify(value)})`,
    expectedType,
    inferFieldType(value),
  );
}

console.log("\n=== 4. sampleLogs every line ===");
for (const sample of sampleLogs) {
  const c = compile(sample.suggestedPattern, fullPatternLibrary);
  for (let i = 0; i < sample.lines.length; i++) {
    assert(
      `${sample.id}[${i}]`,
      matchLine(c, sample.lines[i]).matched,
      "src/samples.ts",
      `sampleLogs ${sample.id} line ${i}`,
      "matched=true",
      "matched=false",
    );
  }
}

console.log("\n=== 5. exportTo ===");
const exportCompiled = compile("%{IP:client:ip} %{WORD:verb}", fullPatternLibrary);
const rawPattern = "%{IP:client:ip} %{WORD:verb}";
for (const target of ["logstash", "vector", "opensearch", "fluentbit", "javascript"]) {
  const content = exportTo(exportCompiled, target, rawPattern);
  assert(
    `export ${target}`,
    validateExportSyntax(target, content).valid,
    "src/export.ts",
    `exportTo/validateExportSyntax(${target})`,
    "valid=true",
    JSON.stringify(validateExportSyntax(target, content)),
  );
}

console.log("\n=== 6. benchmark ===");
const corpus1000 = Array.from(
  { length: 1000 },
  () =>
    '127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET / HTTP/1.1" 200 1234 "-" "curl"',
);
const benchCompiled = compile("%{COMBINEDAPACHELOG}", fullPatternLibrary);
const bench = benchmark(benchCompiled, corpus1000, 5);
assert(
  "benchmark counts",
  bench.iterations === 5 && bench.lineCount === 5000,
  "src/benchmark.ts",
  "benchmark 1000 lines x 5",
  "lineCount=5000",
  String(bench.lineCount),
);
const p95 = evalCorpusP95(benchCompiled, corpus1000, 7);
assert(
  "evalCorpusP95",
  typeof p95 === "number" && p95 < 50,
  "src/benchmark.ts",
  "evalCorpusP95",
  "p95 < 50",
  String(p95),
);
assert(
  "benchmark empty corpus",
  benchmark(benchCompiled, [], 3).matchCount === 0,
  "src/benchmark.ts",
  "benchmark([], 3)",
  "matchCount=0",
  String(benchmark(benchCompiled, [], 3).matchCount),
);

console.log("\n=== 7. diffPatterns ===");
const patA = compile("^%{WORD:x}$", fullPatternLibrary);
const patB = compile("^%{NUMBER:x}$", fullPatternLibrary);
const diff = diffPatterns(patA, patB, ["hello", "42", "3.14"]);
assert(
  "diffPatterns",
  diff[0].patternA &&
    !diff[0].patternB &&
    diff[1].patternA &&
    diff[1].patternB &&
    !diff[2].patternA &&
    diff[2].patternB,
  "src/diff.ts",
  'diffPatterns("^WORD$", "^NUMBER$", ["hello","42","3.14"])',
  "hello:A only, 42:both, 3.14:B only",
  JSON.stringify(diff),
);

console.log("\n=== 8. share roundtrip ===");
const state = {
  pattern: "%{IP:host}",
  corpus: "10.0.0.1",
  mode: "single",
  engine: "vector",
};
const encoded = encodeShare(state);
const decoded = decodeShare(encoded.split("#")[1]);
assert(
  "encode/decode roundtrip",
  decoded?.pattern === state.pattern && decoded?.corpus === state.corpus,
  "src/share.ts",
  "encodeShare -> decodeShare",
  JSON.stringify(state),
  JSON.stringify(decoded),
);

console.log("\n=== 9. ReDoS ===");
assert(
  "safe pattern",
  analyzeReDos("^\\d+$").risk === "none",
  "src/redos.ts",
  'analyzeReDos("^\\\\d+$")',
  "none",
  analyzeReDos("^\\d+$").risk,
);
assert(
  "unsafe (a+)+",
  ["high", "medium"].includes(analyzeReDos("(a+)+").risk),
  "src/redos.ts",
  'analyzeReDos("(a+)+")',
  "high|medium",
  analyzeReDos("(a+)+").risk,
);

console.log("\n=== 10. Edge cases ===");
assert(
  "empty pattern throws",
  throws(() => compile("", fullPatternLibrary), "Pattern cannot be empty"),
  "src/compile.ts",
  'compile("")',
  "throws",
  "no throw",
);
assert(
  "whitespace pattern throws",
  throws(() => compile("   ", fullPatternLibrary), "Pattern cannot be empty"),
  "src/compile.ts",
  'compile("   ")',
  "throws",
  "no throw",
);
assert(
  "malformed unclosed token throws",
  throws(() => compile("%{IP:host", fullPatternLibrary), "Malformed grok token"),
  "src/compile.ts",
  'compile("%{IP:host")',
  "throws Malformed",
  "no throw",
);
assert(
  "matchCorpus empty",
  matchCorpus(simple, []).length === 0,
  "src/match.ts",
  "matchCorpus([])",
  "[]",
  String(matchCorpus(simple, []).length),
);

console.log("\n=== Known-bug probes ===");

// BUG PROBE: IPv4-mapped IPv6 truncated by IP pattern
const ipPat = compile("%{IP:host:ip}", fullPatternLibrary);
const mapped = "::ffff:192.0.2.1";
const mappedMatch = matchLine(ipPat, mapped);
assert(
  "IP captures full IPv4-mapped IPv6 address",
  mappedMatch.matched && mappedMatch.captures.host?.value === mapped,
  "src/patterns/standard.ts",
  `matchLine(compile("%{IP:host:ip}"), ${JSON.stringify(mapped)})`,
  `host=${mapped}`,
  JSON.stringify(mappedMatch.captures.host),
);

assert(
  "inferFieldType IPv4-mapped IPv6",
  inferFieldType("::ffff:192.0.2.1") === "ipv6",
  "src/field-types.ts",
  'inferFieldType("::ffff:192.0.2.1")',
  "ipv6",
  inferFieldType("::ffff:192.0.2.1"),
);

console.log("\n=== SUMMARY ===");
console.log(`Total bugs: ${bugs.length}`);
if (bugs.length > 0) {
  console.log(JSON.stringify(bugs, null, 2));
  process.exit(1);
}
console.log("none — all checks passed");
process.exit(0);
