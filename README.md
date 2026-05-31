# GrokParse

**Write, test and benchmark grok and Logstash patterns online** with field-type inference, ReDoS warnings, mismatch debugging, and exports for Vector, Fluent Bit, OpenSearch, and Logstash.

GrokParse is a **browser-only** playground (Pattern C+D). Your logs never leave your device after the initial page load.

## Features

- **Grok compiler** — `%{PATTERN:name:type}` syntax with 120+ standard Logstash-style patterns
- **Live matching** — debounced per-line match / partial / no-match indicators
- **Field inference** — int, float, ip, date, email, uuid, and more
- **ReDoS warnings** — `safe-regex` plus heuristic catastrophic-backtracking detection
- **Benchmark** — matches/sec across your corpus
- **Pattern diff** — compare two patterns line-by-line
- **Exports** — Logstash, Vector TOML, OpenSearch ingest JSON, Fluent Bit, JavaScript
- **Share links** — URL-encoded pattern + corpus state
- **Custom patterns** — persisted in `localStorage`

## Quick start

```bash
pnpm install
pnpm --filter @grokparse/core build
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
pnpm build
```

Static output: `packages/web/dist/` (deploy to Cloudflare Pages, Netlify, or any static host).

## Docker (self-host)

```bash
docker compose up --build
```

Serves the built app on port 8080.

## Project structure

```
packages/
  core/   # Grok compiler, matcher, exports (npm-ready)
  web/    # Vite + React playground
```

## SEO routes

- `/grok-debugger`
- `/logstash-grok-tester`
- `/grok-to-vector`
- `/grok-to-fluentbit`
- `/grok-pattern-library`

## License

MIT — see [LICENSE](LICENSE).

## Links

- [GitHub](https://github.com/chayprabs/grok-pattern-playground)
- [Privacy Policy](/privacy) (when hosted)
- [Terms](/terms)
