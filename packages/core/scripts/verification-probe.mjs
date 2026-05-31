#!/usr/bin/env node
/**
 * Second-pass verification probe — 30+ scenarios not covered by vitest.
 */
import {
  compile,
  mergeLibraries,
  definePattern,
  matchLine,
  matchCorpus,
  suggestFragments,
  inferFieldType,
  typedCaptures,
  sampleLogs,
  exportTo,
  validateExportSyntax,
  benchmark,
  evalCorpusP95,
  diffPatterns,
  encodeShare,
  decodeShare,
  analyzeReDos,
  estimateWorstCaseMs,
  getPatternCount,
  fullPatternLibrary,
} from "../dist/index.js";

const bugs = [];
let passed = 0;
let failed = 0;

function bug(file, repro, expected, actual) {
  bugs.push({ file, repro, expected, actual });
}

function ok(name) {
  passed++;
  return true;
}

function fail(name, file, repro, expected, actual) {
  failed++;
  console.error(`FAIL: ${name}`);
  bug(file, repro, expected, actual);
  return false;
}

function assert(name, condition, file, repro, expected, actual) {
  if (condition) {
    ok(name);
    return true;
  }
  return fail(name, file, repro, expected, actual);
}

function throws(fn, msgFragment) {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof Error && (!msgFragment || e.message.includes(msgFragment));
  }
}

console.log("=== Extended verification probe (30+ scenarios) ===\n");

// --- compile token variants ---
assert(
  "token: %{PATTERN} no name",
  compile("%{IP}", fullPatternLibrary).fields.length >= 0,
  "src/compile.ts",
  'compile("%{IP}")',
  "compiles",
  "error",
);

const named = compile("%{WORD:host}", fullPatternLibrary);
assert(
  "token: %{PATTERN:name}",
  named.fields.length === 1 && named.fields[0].name === "host",
  "src/compile.ts",
  'compile("%{WORD:host}")',
  "field host",
  JSON.stringify(named.fields),
);

const typed = compile("%{IP:addr:ipv4}", fullPatternLibrary);
assert(
  "token: %{PATTERN:name:type} ipv4 hint",
  typed.fields[0].type === "ipv4",
  "src/compile.ts",
  'compile("%{IP:addr:ipv4}")',
  "type ipv4",
  typed.fields[0]?.type,
);

const allTypes = [
  "int",
  "float",
  "ip",
  "ipv4",
  "ipv6",
  "date",
  "datetime",
  "bool",
  "uri",
  "email",
  "mac",
  "uuid",
  "string",
];
for (const t of allTypes) {
  const c = compile(`%{DATA:f:${t}}`, fullPatternLibrary);
  assert(
    `typed field hint ${t}`,
    c.fields[0]?.type === t,
    "src/compile.ts",
    `compile("%{DATA:f:${t}}")`,
    t,
    c.fields[0]?.type,
  );
}

// --- library merge / definePattern ---
const merged = mergeLibraries(fullPatternLibrary, {
  CUSTOM: definePattern("CUSTOM", "prefix-%{WORD:x}-suffix", {
    description: "test",
  }),
});
const customMatch = matchLine(compile("%{CUSTOM:msg}", merged), "prefix-foo-suffix");
assert(
  "mergeLibraries custom pattern matches",
  customMatch.matched && customMatch.captures.msg?.value === "prefix-foo-suffix",
  "src/compile.ts",
  "mergeLibraries CUSTOM",
  "matched prefix-foo-suffix",
  JSON.stringify(customMatch.captures),
);

const override = mergeLibraries(fullPatternLibrary, {
  WORD: definePattern("WORD", "[A-Za-z]+"),
});
assert(
  "mergeLibraries overrides WORD",
  matchLine(compile("^%{WORD:x}$", override), "hello").matched &&
    !matchLine(compile("^%{WORD:x}$", override), "42").matched,
  "src/patterns/standard.ts",
  "override WORD to alpha-only",
  "hello yes, 42 no",
  "see repro",
);

assert(
  "circular reference throws",
  throws(() => compile("%{LOOP}", { LOOP: definePattern("LOOP", "%{LOOP}") }), "Circular"),
  "src/compile.ts",
  "compile('%{LOOP}') with self-ref",
  "throws Circular",
  "no throw",
);

assert(
  "unknown pattern throws",
  throws(() => compile("%{NOTAPATTERN}", fullPatternLibrary), "Unknown grok pattern"),
  "src/compile.ts",
  'compile("%{NOTAPATTERN}")',
  "throws Unknown",
  "no throw",
);

// --- matchLine edge cases ---
const partialPat = compile("^foo bar$", fullPatternLibrary);
const pr = matchLine(partialPat, "foo bar extra");
assert(
  "partial: suffix overflow",
  !pr.matched && pr.partial === true,
  "src/match.ts",
  'matchLine("^foo bar$", "foo bar extra")',
  "partial=true",
  JSON.stringify({ matched: pr.matched, partial: pr.partial }),
);

const prefixPartial = compile("^hello world$", fullPatternLibrary);
const pp = matchLine(prefixPartial, "hello");
assert(
  "partial: incomplete prefix not partial",
  !pp.matched && !pp.partial,
  "src/match.ts",
  'matchLine("^hello world$", "hello")',
  "partial=false",
  String(pp.partial),
);

assert(
  "no match plain",
  !matchLine(compile("%{IP:ip}", fullPatternLibrary), "not an ip").matched,
  "src/match.ts",
  'matchLine("%{IP}", "not an ip")',
  "matched=false",
  "true",
);

assert(
  "matchLine null coerces to empty",
  !matchLine(compile("^$", fullPatternLibrary), null).matched,
  "src/match.ts",
  "matchLine(null line)",
  "matched=false on empty",
  "unexpected",
);

// --- suggestFragments ---
const frags = suggestFragments("192.168.1.1");
assert(
  "suggestFragments IP",
  frags.some((f) => f.includes("IP")),
  "src/match.ts",
  'suggestFragments("192.168.1.1")',
  "includes IP suggestion",
  JSON.stringify(frags),
);

// --- inferFieldType + typedCaptures ---
assert(
  "inferFieldType hint overrides value",
  inferFieldType("42", "string") === "string",
  "src/field-types.ts",
  'inferFieldType("42", "string")',
  "string",
  inferFieldType("42", "string"),
);

assert(
  "inferFieldType ::1 ipv6",
  inferFieldType("::1") === "ipv6",
  "src/field-types.ts",
  'inferFieldType("::1")',
  "ipv6",
  inferFieldType("::1"),
);

const tc = typedCaptures({ n: "42" }, [{ name: "n", type: "int" }]);
assert(
  "typedCaptures uses field type hint",
  tc.n?.type === "int",
  "src/field-types.ts",
  'typedCaptures({n:"42"}, [{name:"n",type:"int"}])',
  "int",
  tc.n?.type,
);

// --- sampleLogs compile all lines (stricter than vitest anyMatch) ---
for (const sample of sampleLogs) {
  const c = compile(sample.suggestedPattern, fullPatternLibrary);
  for (let i = 0; i < sample.lines.length; i++) {
    assert(
      `sampleLogs all-lines ${sample.id}[${i}]`,
      matchLine(c, sample.lines[i]).matched,
      "src/samples.ts",
      `${sample.id} line ${i}`,
      "matched=true",
      "matched=false",
    );
  }
}

// --- exports all targets + edge escaping ---
const exportPat = compile('%{WORD:w} "quoted"', fullPatternLibrary);
const rawEsc = '%{WORD:w} "quoted\\n"';
for (const target of ["logstash", "vector", "opensearch", "fluentbit", "javascript"]) {
  const content = exportTo(exportPat, target, rawEsc);
  const v = validateExportSyntax(target, content);
  assert(
    `export+validate ${target} with escapes`,
    v.valid,
    "src/export.ts",
    `exportTo(${target}) validateExportSyntax`,
    "valid=true",
    JSON.stringify(v),
  );
}

assert(
  "validateExportSyntax rejects bad JSON opensearch",
  !validateExportSyntax("opensearch", "{bad").valid,
  "src/export.ts",
  'validateExportSyntax("opensearch", "{bad")',
  "valid=false",
  "valid=true",
);

// --- share hash AND full URL ---
const shareState = {
  pattern: "%{GREEDYDATA:msg}",
  corpus: "line1\\nline2",
  mode: "diff",
  patternB: "%{WORD:w}",
  engine: "logstash",
};
const fullUrl = encodeShare(shareState);
const hashOnly = fullUrl.split("#")[1];
assert(
  "decodeShare full URL",
  JSON.stringify(decodeShare(fullUrl)) === JSON.stringify(shareState),
  "src/share.ts",
  "decodeShare(fullUrl)",
  JSON.stringify(shareState),
  JSON.stringify(decodeShare(fullUrl)),
);
assert(
  "decodeShare hash only",
  JSON.stringify(decodeShare(`#${hashOnly}`)) === JSON.stringify(shareState),
  "src/share.ts",
  "decodeShare(#hash)",
  JSON.stringify(shareState),
  JSON.stringify(decodeShare(`#${hashOnly}`)),
);
assert(
  "decodeShare raw base64",
  JSON.stringify(decodeShare(hashOnly)) === JSON.stringify(shareState),
  "src/share.ts",
  "decodeShare(rawBase64)",
  JSON.stringify(shareState),
  JSON.stringify(decodeShare(hashOnly)),
);
assert(
  "decodeShare invalid returns null",
  decodeShare("!!!not-valid!!!") === null,
  "src/share.ts",
  'decodeShare("!!!not-valid!!!")',
  "null",
  String(decodeShare("!!!not-valid!!!")),
);

// --- diffPatterns (semantic check with alpha-only WORD override) ---
const wordAlpha = compile("^%{WORD:x}$", override);
const numPat = compile("^%{NUMBER:x}$", fullPatternLibrary);
const diff = diffPatterns(wordAlpha, numPat, ["hello", "42", "3.14"]);
assert(
  "diffPatterns alpha-WORD vs NUMBER",
  diff[0].patternA && !diff[0].patternB &&
    !diff[1].patternA && diff[1].patternB &&
    !diff[2].patternA && diff[2].patternB,
  "src/diff.ts",
  'diffPatterns with alpha WORD vs NUMBER',
  "hello:A, 42:B, 3.14:B",
  JSON.stringify(diff),
);

assert(
  "diffPatterns empty corpus",
  diffPatterns(wordAlpha, numPat, []).length === 0,
  "src/diff.ts",
  "diffPatterns([], ...)",
  "[]",
  String(diffPatterns(wordAlpha, numPat, []).length),
);

// --- benchmark ---
const benchPat = compile("%{COMBINEDAPACHELOG}", fullPatternLibrary);
const line =
  '127.0.0.1 - - [10/Oct/2023:13:55:36 +0000] "GET / HTTP/1.1" 200 1234 "-" "curl"';
const corpus = Array.from({ length: 100 }, () => line);
const b = benchmark(benchPat, corpus, 3);
assert(
  "benchmark matchCount > 0",
  b.matchCount === 300 && b.lineCount === 300,
  "src/benchmark.ts",
  "benchmark 100x3",
  "matchCount=300",
  String(b.matchCount),
);
const p95 = evalCorpusP95(benchPat, corpus, 5);
assert(
  "evalCorpusP95 finite",
  Number.isFinite(p95) && p95 >= 0,
  "src/benchmark.ts",
  "evalCorpusP95",
  "finite >= 0",
  String(p95),
);

// --- ReDoS safe vs catastrophic ---
assert(
  "ReDoS safe ^\\d+$",
  analyzeReDos("^\\d+$").risk === "none",
  "src/redos.ts",
  'analyzeReDos("^\\\\d+$")',
  "none",
  analyzeReDos("^\\d+$").risk,
);
assert(
  "ReDoS catastrophic (a+)+b",
  analyzeReDos("(a+)+b").risk === "high",
  "src/redos.ts",
  'analyzeReDos("(a+)+b")',
  "high",
  analyzeReDos("(a+)+b").risk,
);
assert(
  "ReDoS NUMBER compile not high",
  compile("%{NUMBER:x}", fullPatternLibrary).reDosRisk !== "high",
  "src/redos.ts",
  'compile("%{NUMBER:x}").reDosRisk',
  "not high",
  compile("%{NUMBER:x}", fullPatternLibrary).reDosRisk,
);
const safeRe = /^\\d+$/;
const unsafeRe = /(a+)+/;
assert(
  "estimateWorstCaseMs safe fast",
  estimateWorstCaseMs(safeRe, "1", 50) === false,
  "src/redos.ts",
  "estimateWorstCaseMs safe",
  "false (under limit)",
  String(estimateWorstCaseMs(safeRe, "1", 50)),
);

// --- regression.test.ts scenarios ---
assert(
  "regression PROG slash",
  matchLine(compile("%{PROG:program}", fullPatternLibrary), "postfix/smtp").matched,
  "src/patterns/standard.ts",
  'matchLine("%{PROG}", "postfix/smtp")',
  "matched=true",
  "false",
);
assert(
  "regression HOSTNAME rejects 999.999.999.999",
  !matchLine(compile("^%{HOSTNAME:host}$", fullPatternLibrary), "999.999.999.999").matched,
  "src/patterns/standard.ts",
  'HOSTNAME vs "999.999.999.999"',
  "matched=false",
  "true",
);
assert(
  "regression CLOUDTRAIL full JSON only",
  !matchLine(
    compile("%{CLOUDTRAIL}", fullPatternLibrary),
    'prefix {"eventTime":"2023-01-01T00:00:00Z"} suffix',
  ).matched &&
    matchLine(
      compile("%{CLOUDTRAIL}", fullPatternLibrary),
      '{"eventTime":"2023-01-01T00:00:00Z"}',
    ).matched,
  "src/patterns/standard.ts",
  "CLOUDTRAIL anchoring",
  "prefix/suffix false, full true",
  "see repro",
);
assert(
  "regression JAVA_CLASS package",
  !matchLine(compile("%{JAVA_CLASS:class}", fullPatternLibrary), "Exception in thread").matched &&
    matchLine(compile("%{JAVA_CLASS:class}", fullPatternLibrary), "com.example.App").matched,
  "src/patterns/standard.ts",
  "JAVA_CLASS",
  "Exception false, com.example.App true",
  "see repro",
);
assert(
  "regression IPv4-mapped IPv6 full capture",
  matchLine(compile("%{IP:host:ip}", fullPatternLibrary), "::ffff:192.0.2.1").captures.host
    ?.value === "::ffff:192.0.2.1",
  "src/patterns/standard.ts",
  'IP capture "::ffff:192.0.2.1"',
  "::ffff:192.0.2.1",
  matchLine(compile("%{IP:host:ip}", fullPatternLibrary), "::ffff:192.0.2.1").captures.host
    ?.value,
);

// --- edge cases ---
assert(
  "empty corpus matchCorpus",
  matchCorpus(compile("%{WORD:a}", fullPatternLibrary), []).length === 0,
  "src/match.ts",
  "matchCorpus([])",
  "[]",
  "non-empty",
);
assert(
  "whitespace-only pattern throws",
  throws(() => compile("\\t  \\n", fullPatternLibrary), "Pattern cannot be empty"),
  "src/compile.ts",
  'compile("\\t  \\n")',
  "throws empty",
  "no throw",
);
assert(
  "malformed token space before }",
  throws(() => compile("%{IP:host :}", fullPatternLibrary), "Malformed"),
  "src/compile.ts",
  'compile("%{IP:host :}")',
  "throws Malformed",
  "no throw",
);
assert(
  "getPatternCount >= 120",
  getPatternCount() >= 120,
  "src/patterns/standard.ts",
  "getPatternCount()",
  ">= 120",
  String(getPatternCount()),
);

// --- composite unwrapping nested fields ---
const nestedLib = mergeLibraries(fullPatternLibrary, {
  ENDPOINT: definePattern("ENDPOINT", "%{IP:addr:ip}:%{NUMBER:port:int}"),
});
const nestedFields = compile("%{ENDPOINT:ep}", nestedLib).fields.map((f) => f.name).join(",");
assert(
  "composite exposes nested field names",
  nestedFields === "addr,port",
  "src/compile.ts",
  "compile('%{ENDPOINT}') fields",
  "addr,port",
  nestedFields,
);

console.log(`\n=== PROBE SUMMARY ===`);
console.log(`Passed: ${passed}, Failed: ${failed}, Bugs: ${bugs.length}`);
if (bugs.length > 0) {
  console.log(JSON.stringify(bugs, null, 2));
  process.exit(1);
}
console.log("none");
process.exit(0);
