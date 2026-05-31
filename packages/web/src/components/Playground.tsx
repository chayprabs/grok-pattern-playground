import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  benchmark,
  compile,
  decodeShare,
  diffPatterns,
  encodeShare,
  estimateWorstCaseMs,
  exportTo,
  fullPatternLibrary,
  matchCorpus,
  sampleLogs,
  suggestFragments,
  type CaptureValue,
  type ExportTarget,
  type MatchResult,
} from "@grokparse/core";
import { CodeEditor, type CodeEditorHandle } from "./CodeEditor";
import { MatchLineHighlight } from "./MatchLineHighlight";
import { useDebounce } from "../hooks/useDebounce";
import { useCustomPatterns } from "../hooks/useCustomPatterns";
import { useBenchmarkWorker } from "../hooks/useBenchmarkWorker";
import { buildLibrary } from "../lib/patternLib";

type Mode = "single" | "diff";

export function Playground({ defaultExport }: { defaultExport?: ExportTarget }) {
  const { custom, addPattern, removePattern, clearAll } = useCustomPatterns();
  const library = useMemo(() => buildLibrary(custom), [custom]);

  const [pattern, setPattern] = useState("%{COMBINEDAPACHELOG}");
  const [patternB, setPatternB] = useState("%{COMMONAPACHELOG}");
  const [corpus, setCorpus] = useState(sampleLogs[0].lines.join("\n"));
  const [mode, setMode] = useState<Mode>("single");
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>(
    defaultExport ?? "vector",
  );
  const [benchIters, setBenchIters] = useState(5);
  const [customName, setCustomName] = useState("");
  const [customPat, setCustomPat] = useState("");
  const [libSearch, setLibSearch] = useState("");
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compileErrorB, setCompileErrorB] = useState<string | null>(null);
  const [slowWarning, setSlowWarning] = useState(false);
  const patternEditorRef = useRef<CodeEditorHandle>(null);
  const {
    result: workerBench,
    error: workerBenchError,
    running: benchRunning,
    run: runWorkerBench,
  } = useBenchmarkWorker();

  const debouncedPattern = useDebounce(pattern, 100);
  const debouncedCorpus = useDebounce(corpus, 100);
  const debouncedPatternB = useDebounce(patternB, 100);

  useEffect(() => {
    const hash = window.location.hash;
    const shared = decodeShare(hash);
    if (shared) {
      setPattern(shared.pattern);
      setCorpus(shared.corpus);
      setMode(shared.mode);
      if (shared.patternB) setPatternB(shared.patternB);
      if (shared.engine) setExportTarget(shared.engine);
    }
  }, []);

  const corpusLines = useMemo(() => {
    const raw = debouncedCorpus.split("\n");
    return raw.length === 1 && raw[0] === "" ? [] : raw;
  }, [debouncedCorpus]);

  const compiled = useMemo(() => {
    try {
      return compile(debouncedPattern, library);
    } catch {
      return null;
    }
  }, [debouncedPattern, library]);

  const compiledB = useMemo(() => {
    if (mode !== "diff") return null;
    try {
      return compile(debouncedPatternB, library);
    } catch {
      return null;
    }
  }, [debouncedPatternB, library, mode]);

  useEffect(() => {
    try {
      compile(debouncedPattern, library);
      setCompileError(null);
    } catch (e) {
      setCompileError(e instanceof Error ? e.message : "Compile error");
    }
  }, [debouncedPattern, library]);

  useEffect(() => {
    if (mode !== "diff") {
      setCompileErrorB(null);
      return;
    }
    try {
      compile(debouncedPatternB, library);
      setCompileErrorB(null);
    } catch (e) {
      setCompileErrorB(e instanceof Error ? e.message : "Compile error");
    }
  }, [debouncedPatternB, library, mode]);

  useEffect(() => {
    setSelectedLine(null);
  }, [mode]);

  const results: MatchResult[] = useMemo(() => {
    if (!compiled) return [];
    return matchCorpus(compiled, corpusLines);
  }, [compiled, corpusLines]);

  const diffResults = useMemo(() => {
    if (mode !== "diff" || !compiled || !compiledB) return [];
    return diffPatterns(compiled, compiledB, corpusLines);
  }, [mode, compiled, compiledB, corpusLines]);

  const benchStats = useMemo(() => {
    if (!compiled || corpusLines.length === 0) return null;
    if (corpusLines.length >= 50) return null;
    return benchmark(compiled, corpusLines, benchIters);
  }, [compiled, corpusLines, benchIters]);

  useEffect(() => {
    if (!compiled || corpusLines.length < 50) return;
    runWorkerBench(debouncedPattern, corpusLines, benchIters, custom);
  }, [compiled, corpusLines, benchIters, debouncedPattern, custom, runWorkerBench]);

  const activeBenchStats =
    corpusLines.length >= 50 ? workerBench : benchStats;

  useEffect(() => {
    if (!compiled) {
      setSlowWarning(false);
      return;
    }
    const probe =
      corpusLines[0] ?? "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    setSlowWarning(estimateWorstCaseMs(compiled.regex, probe));
  }, [compiled, corpusLines]);

  const exportContent = useMemo(() => {
    if (!compiled) return "";
    return exportTo(compiled, exportTarget, debouncedPattern);
  }, [compiled, exportTarget, debouncedPattern]);

  const filteredLibrary = useMemo(() => {
    const q = libSearch.toLowerCase();
    return Object.values(fullPatternLibrary).filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.pattern?.toLowerCase().includes(q) ?? false) ||
        (p.example?.toLowerCase().includes(q) ?? false),
    );
  }, [libSearch]);

  const handleShare = useCallback(() => {
    const url = encodeShare({
      pattern,
      corpus,
      mode,
      patternB: mode === "diff" ? patternB : undefined,
      engine: exportTarget,
    });
    navigator.clipboard.writeText(url);
  }, [pattern, corpus, mode, patternB, exportTarget]);

  const insertPattern = useCallback((token: string) => {
    patternEditorRef.current?.insertAtCursor(token);
  }, []);

  const loadSample = (id: string) => {
    const s = sampleLogs.find((x) => x.id === id);
    if (!s) return;
    setCorpus(s.lines.join("\n"));
    setPattern(s.suggestedPattern);
  };

  const selectedResult =
    selectedLine !== null ? results[selectedLine] : undefined;
  const suggestions =
    selectedResult && !selectedResult.matched && selectedLine !== null
      ? suggestFragments(corpusLines[selectedLine]?.slice(selectedResult.matchLength ?? 0) ?? "")
      : [];

  return (
    <main className="playground">
      <div className="toolbar">
        <div className="mode-toggle">
          <button
            type="button"
            className={mode === "single" ? "active" : ""}
            onClick={() => setMode("single")}
          >
            Single
          </button>
          <button
            type="button"
            className={mode === "diff" ? "active" : ""}
            onClick={() => setMode("diff")}
          >
            Diff
          </button>
        </div>
        <select
          aria-label="Sample logs"
          onChange={(e) => loadSample(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Load sample…
          </option>
          {sampleLogs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={handleShare}>
          Copy share link
        </button>
        <button type="button" className="btn-secondary" onClick={clearAll}>
          Clear custom patterns
        </button>
      </div>

      <div className="panes">
        <section className="pane pane-pattern">
          <CodeEditor
            ref={patternEditorRef}
            id="pattern"
            label="Grok pattern"
            value={pattern}
            onChange={setPattern}
            rows={5}
            language="plaintext"
          />
          {mode === "diff" && (
            <CodeEditor
              id="pattern-b"
              label="Pattern B"
              value={patternB}
              onChange={setPatternB}
              rows={4}
              language="plaintext"
            />
          )}
          {compileError && <p className="error">{compileError}</p>}
          {mode === "diff" && compileErrorB && (
            <p className="error">Pattern B: {compileErrorB}</p>
          )}
          {compiled && (
            <div className="redos-badge" data-risk={compiled.reDosRisk}>
              ReDoS: {compiled.reDosRisk}
              {slowWarning && (
                <span className="warn-item">
                  Worst-case input may exceed 100ms — test on a small corpus first.
                </span>
              )}
              {compiled.warnings.map((w) => (
                <span key={w} className="warn-item">
                  {w}
                </span>
              ))}
            </div>
          )}

          <details className="library-panel">
            <summary>Pattern library ({Object.keys(fullPatternLibrary).length})</summary>
            <input
              type="search"
              placeholder="Search patterns…"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
            />
            <ul className="lib-list">
              {filteredLibrary.slice(0, 40).map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    className="lib-insert"
                    onClick={() => insertPattern(`%{${p.name}}`)}
                  >
                    {p.name}
                  </button>
                  <span className="lib-desc">{p.description}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="custom-patterns">
            <h3>Custom patterns</h3>
            <div className="custom-row">
              <input
                placeholder="NAME"
                value={customName}
                onChange={(e) => setCustomName(e.target.value.toUpperCase())}
              />
              <input
                placeholder="regex or %{SUB}"
                value={customPat}
                onChange={(e) => setCustomPat(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (customName && customPat) {
                    addPattern(customName, customPat);
                    setCustomName("");
                    setCustomPat("");
                  }
                }}
              >
                Add
              </button>
            </div>
            <ul>
              {Object.keys(custom).map((name) => (
                <li key={name}>
                  {name}{" "}
                  <button type="button" onClick={() => removePattern(name)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="pane pane-corpus">
          <CodeEditor
            id="corpus"
            label="Log corpus (one line per row)"
            value={corpus}
            onChange={setCorpus}
            rows={14}
            language="plaintext"
          />
        </section>

        <section className="pane pane-results">
          <h2>Results</h2>
          <div className="results-scroll">
            {mode === "diff" && compileError && !compiled ? (
              <p className="error">Fix Pattern A to view diff results.</p>
            ) : mode === "diff" && compileErrorB ? (
              <p className="error">Fix Pattern B to view diff results.</p>
            ) : mode === "diff" && corpusLines.length === 0 ? (
              <p className="muted-hint">Add log lines to compare patterns.</p>
            ) : mode === "diff" ? (
              diffResults.map((d) => (
                <div
                  key={d.index}
                  className={`result-line ${d.changed ? "changed" : ""}`}
                >
                  <span className="line-num">{d.index + 1}</span>
                  <span>
                    A:{d.patternA ? "✓" : "✗"} B:{d.patternB ? "✓" : "✗"}
                  </span>
                  <code>{d.line}</code>
                </div>
              ))
            ) : results.map((r, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`result-line status-${r.matched ? "match" : r.partial ? "partial" : "nomatch"}`}
                    onClick={() => setSelectedLine(i)}
                  >
                    <span className="line-num">{i + 1}</span>
                    <span className="status-dot" />
                    {r.matched && r.captureSpans?.length ? (
                      <MatchLineHighlight line={r.line} spans={r.captureSpans} />
                    ) : (
                      <code>{r.line}</code>
                    )}
                  </button>
                ))}
          </div>

          {selectedResult && (
            <div className="debugger">
              <h3>Mismatch debugger</h3>
              {!selectedResult.matched && (
                <>
                  <p>
                    Match length: {selectedResult.matchLength ?? 0}, divergence
                    at column: {selectedResult.divergencePosition ?? 0}
                  </p>
                  {suggestions.length > 0 && (
                    <p>Suggestions: {suggestions.join(", ")}</p>
                  )}
                </>
              )}
              {Object.keys(selectedResult.captures).length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      Object.entries(selectedResult.captures) as [
                        string,
                        CaptureValue,
                      ][]
                    ).map(([k, v]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td>{v.value}</td>
                        <td>{v.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>

      <section className="bottom-panel">
        <div className="bench">
          <h3>Benchmark</h3>
          <label>
            Iterations{" "}
            <input
              type="number"
              min={1}
              max={100}
              value={benchIters}
              onChange={(e) =>
                setBenchIters(
                  Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
          {benchRunning && <p>Running benchmark in worker…</p>}
          {workerBenchError && (
            <p className="error">Benchmark error: {workerBenchError}</p>
          )}
          {activeBenchStats && (
            <p>
              {activeBenchStats.matchesPerSec.toFixed(0)} matches/sec · p95{" "}
              {activeBenchStats.p95Ms.toFixed(2)} ms
              {corpusLines.length >= 50 && " (worker)"}
            </p>
          )}
        </div>
        <div className="export">
          <h3>Export</h3>
          <select
            value={exportTarget}
            onChange={(e) => setExportTarget(e.target.value as ExportTarget)}
          >
            <option value="logstash">Logstash</option>
            <option value="vector">Vector</option>
            <option value="opensearch">OpenSearch</option>
            <option value="fluentbit">Fluent Bit</option>
            <option value="javascript">JavaScript</option>
          </select>
          <pre className="export-output">{exportContent}</pre>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigator.clipboard.writeText(exportContent)}
          >
            Copy export
          </button>
        </div>
      </section>
    </main>
  );
}
