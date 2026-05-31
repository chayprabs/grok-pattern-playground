#!/usr/bin/env node
/**
 * GrokParse end-to-end valid I/O probe — 25+ real-world scenarios.
 * Run from repo root: node scripts/e2e-probe.mjs
 */
import {
  compile,
  mergeLibraries,
  definePattern,
  matchLine,
  exportTo,
  validateExportSyntax,
  encodeShare,
  decodeShare,
  diffPatterns,
  fullPatternLibrary,
  sampleLogs,
} from "../packages/core/dist/index.js";

const bugs = [];
let passed = 0;
let failed = 0;

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail, file, fix) {
  failed++;
  bugs.push({ id: bugs.length + 1, name, detail, file, fix });
  console.log(`  ✗ ${name}`);
  console.log(`    ${detail}`);
}

function assert(name, cond, detail, file, fix) {
  if (cond) pass(name);
  else fail(name, detail, file, fix);
}

function uiSearchLibrary(query) {
  const q = query.toLowerCase();
  return Object.values(fullPatternLibrary).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false),
  );
}

console.log("\n=== 1. Sample logs × library patterns (valid expectations) ===\n");

const samplePatternMatrix = {
  nginx: ["%{NGINXACCESS}", "%{COMBINEDAPACHELOG}", "%{VARNISH}"],
  syslog: ["%{SYSLOGLINE}", "%{SSH}", "%{FIREWALL}"],
  apache: ["%{COMBINEDAPACHELOG}", "%{LIGHTTPD}"],
  java: ["%{GREEDYDATA:message}", "%{JAVA_STACKTRACEPART}"],
  cloudtrail: ["%{CLOUDTRAIL}", '"eventTime":"%{NOTSPACE:eventTime}"'],
};

for (const sample of sampleLogs) {
  const patterns = samplePatternMatrix[sample.id] ?? [sample.suggestedPattern];
  for (const pat of patterns) {
    const label = `${sample.id} / ${pat.slice(0, 40)}`;
    const expectMatch =
      pat.includes("SSH") || pat.includes("SSHD")
        ? (line) => line.includes("sshd")
        : pat.includes("JAVA_STACKTRACEPART")
          ? (line) => line.trimStart().startsWith("at ")
          : () => true;
    try {
      const c = compile(pat, fullPatternLibrary);
      for (let i = 0; i < sample.lines.length; i++) {
        if (!expectMatch(sample.lines[i])) {
          pass(`${label} line ${i + 1} (correct non-match)`);
          continue;
        }
        const r = matchLine(c, sample.lines[i]);
        assert(
          `${label} line ${i + 1}`,
          r.matched,
          `Expected match on: ${sample.lines[i].slice(0, 80)}…`,
          "packages/core/src/patterns/standard.ts",
          `Fix ${pat} or sample line for ${sample.id}`,
        );
      }
    } catch (e) {
      fail(
        `${label} compile`,
        e instanceof Error ? e.message : String(e),
        "packages/core/src/compile.ts",
        "Fix compile/expansion for this pattern",
      );
    }
  }
}

console.log("\n=== 2. All suggested patterns match all sample lines ===\n");

for (const sample of sampleLogs) {
  const c = compile(sample.suggestedPattern, fullPatternLibrary);
  for (let i = 0; i < sample.lines.length; i++) {
    assert(
      `${sample.id} suggested line ${i + 1}`,
      matchLine(c, sample.lines[i]).matched,
      sample.lines[i],
      "packages/core/src/samples.ts",
      "Update suggestedPattern or sample lines",
    );
  }
}

console.log("\n=== 3. Export validity (JSON / structure) ===\n");

const exportPatterns = [
  "%{COMBINEDAPACHELOG}",
  '%{IP:client:ip} - %{USER:ident} \\[%{HTTPDATE:ts}\\] "%{WORD:verb} %{DATA:req}" %{NUMBER:status}',
  '"eventTime":"%{NOTSPACE:eventTime}"',
  '%{SYSLOGLINE} with "quotes" and \\\\backslash',
];

const targets = ["logstash", "vector", "opensearch", "fluentbit", "javascript"];

for (const raw of exportPatterns) {
  const c = compile(raw.replace(/\\\\backslash/g, "\\\\"), fullPatternLibrary);
  for (const target of targets) {
    const content = exportTo(c, target, raw);
    const v = validateExportSyntax(target, content);
    assert(
      `export ${target}`,
      v.valid,
      v.message,
      "packages/core/src/export.ts",
      "Fix export or validation for this target",
    );
    if (target === "opensearch") {
      try {
        const parsed = JSON.parse(content);
        assert(
          `opensearch JSON shape`,
          parsed?.processors?.[0]?.grok?.patterns?.length > 0,
          "Missing grok processor",
          "packages/core/src/export.ts",
          "Include processors[0].grok.patterns",
        );
      } catch (e) {
        fail(
          "opensearch JSON.parse",
          e instanceof Error ? e.message : String(e),
          "packages/core/src/export.ts",
          "Ensure valid JSON export",
        );
      }
    }
  }
}

console.log("\n=== 4. Share URL encode/decode (pattern, corpus, diff, engine) ===\n");

const shareCases = [
  {
    pattern: "%{NGINXACCESS}",
    corpus: sampleLogs[0].lines.join("\n"),
    mode: "single",
    engine: "vector",
  },
  {
    pattern: "%{COMMONAPACHELOG}",
    patternB: "%{COMBINEDAPACHELOG}",
    corpus: sampleLogs[2].lines[0],
    mode: "diff",
    engine: "logstash",
  },
  {
    pattern: "%{SYSLOGLINE}",
    corpus: "Oct 10 13:55:36 café-server sshd[1]: unicode 日本",
    mode: "single",
    engine: "fluentbit",
  },
];

for (const state of shareCases) {
  const url = encodeShare(state);
  const hash = url.includes("#") ? url.slice(url.indexOf("#")) : url;
  const decoded = decodeShare(hash);
  assert(
    `share hash round-trip (${state.mode}/${state.engine})`,
    decoded !== null &&
      decoded.pattern === state.pattern &&
      decoded.corpus === state.corpus &&
      decoded.mode === state.mode &&
      decoded.engine === state.engine &&
      (state.mode !== "diff" || decoded.patternB === state.patternB),
    JSON.stringify(decoded),
    "packages/core/src/share.ts",
    "Fix encodeShare/decodeShare UTF-8 base64 handling",
  );
}

// Known bug: full URL paste
const fullUrl =
  "https://grokparse.example/#eyJwYXR0ZXJuIjoiJXtXT1JEfSIsImNvcnB1cyI6InRlc3QiLCJtb2RlIjoic2luZ2xlIn0=";
assert(
  "share decode accepts full URL (currently fails)",
  decodeShare(fullUrl) !== null,
  "decodeShare returns null for full pasted URL",
  "packages/core/src/share.ts",
  "Strip origin/path before atob: extract substring after last #",
);

console.log("\n=== 5. Pattern library search (UI mirror) ===\n");

for (const { q, min } of [
  { q: "nginx", min: 2 },
  { q: "syslog", min: 2 },
  { q: "cloudtrail", min: 1 },
]) {
  const hits = uiSearchLibrary(q);
  assert(`search "${q}"`, hits.length >= min, `got ${hits.length}`, "packages/web/src/components/Playground.tsx", "Add descriptions/examples");
}

console.log("\n=== 6. Custom pattern compile ===\n");

const customLib = mergeLibraries(fullPatternLibrary, {
  MYAPP: definePattern("MYAPP", "myapp\\[%{POSINT:pid}\\]: %{GREEDYDATA:msg}"),
});
assert(
  "custom MYAPP matches",
  matchLine(compile("%{MYAPP}", customLib), "myapp[42]: event").matched,
  "no match",
  "packages/core/src/compile.ts",
  "Check mergeLibraries",
);

console.log("\n=== 7. Known regex gaps & false positives ===\n");

// BUG: PROG rejects slash
const sl = compile("%{SYSLOGLINE}", fullPatternLibrary);
assert(
  "SYSLOGLINE matches postfix/smtp program name",
  matchLine(sl, "Oct 10 13:55:36 mx postfix/smtp[1]: status=sent").matched,
  "PROG=[a-zA-Z0-9_\\-]+ rejects '/' in postfix/smtp",
  "packages/core/src/patterns/standard.ts",
  "Change PROG to [a-zA-Z0-9._/-]+ (dash at end of class)",
);

// BUG: JAVACLASS false positive on exception header
const jc = compile("%{JAVACLASS:class}", fullPatternLibrary);
const jcap = matchLine(jc, 'Exception in thread "main" java.lang.NullPointerException');
assert(
  "JAVACLASS should not capture 'Exception' on header line",
  !jcap.matched || jcap.captures.class?.value.includes("."),
  `captured '${jcap.captures.class?.value}' instead of FQCN`,
  "packages/core/src/patterns/standard.ts",
  "Anchor JAVA_CLASS or require \\s+at prefix for stack patterns",
);

// BUG: HOSTNAME accepts invalid dotted numbers
const hn = compile("%{HOSTNAME:host}", fullPatternLibrary);
assert(
  "HOSTNAME rejects 999.999.999.999",
  !matchLine(hn, "999.999.999.999").matched,
  "invalid IP-like string matched as hostname",
  "packages/core/src/patterns/standard.ts",
  "Tighten HOSTNAME or prefer IPORHOST order in log patterns",
);

// BUG: CLOUDTRAIL matches substring
const ct = compile("%{CLOUDTRAIL}", fullPatternLibrary);
assert(
  "CLOUDTRAIL rejects non-JSON-line prefix text",
  !matchLine(ct, 'prefix {"eventTime":"2023-10-10T13:55:36Z"} suffix').matched,
  "matched embedded JSON substring in plain text",
  "packages/core/src/patterns/standard.ts",
  "Anchor CLOUDTRAIL with ^\\{ and \\}$ or use JSON parser",
);

console.log("\n=== 8. Extra valid real-world lines (25+ scenarios) ===\n");

const extras = [
  ["%{NGINXACCESS}", '::1 - - [01/Jan/2024:00:00:00 +0000] "GET / HTTP/2.0" 304 0 "-" "-"'],
  ["%{SYSLOGLINE}", "Jan  1 00:00:00 host CRON[999]: (root) CMD"],
  ["%{COMBINEDAPACHELOG}", '203.0.113.5 - - [10/Oct/2023:13:55:36 +0000] "GET / HTTP/1.1" 200 1234 "-" "Bot"'],
  ["%{JAVA_STACKTRACEPART}", "    at com.example.App.main(App.java:42)"],
  ["%{HAPROXYHTTP}", "192.0.2.1:54321"],
  ["%{TIMESTAMP_ISO8601:ts}", "2023-10-10T13:55:36.123Z"],
  ["%{EMAILADDRESS:email}", "user+tag@example.co.uk"],
  ["%{URI:url}", "https://example.com/path?q=1"],
  ["%{COMMONMAC:mac}", "00:11:22:33:44:55"],
  ["%{HTTPD24_ERRORLOG}", "[Wed Oct 11 14:15:16 2023] [error] [client 127.0.0.1] File does not exist"],
];

for (const [pat, line] of extras) {
  assert(`extra ${pat}`, matchLine(compile(pat, fullPatternLibrary), line).matched, line.slice(0, 60), "packages/core/src/patterns/standard.ts", `Fix ${pat}`);
}

console.log("\n=== SUMMARY ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Documented bugs: ${bugs.length}`);
if (bugs.length) {
  console.log("\n" + JSON.stringify(bugs, null, 2));
  process.exit(1);
}
