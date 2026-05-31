# Contributing to GrokParse

Thank you for your interest in contributing.

## Development setup

1. Install Node.js 22+ and pnpm 9+.
2. Clone the repository and run `pnpm install`.
3. Build core: `pnpm --filter @grokparse/core build`.
4. Start the dev server: `pnpm dev`.

## Pull requests

- Keep changes focused and covered by tests where behavior changes.
- Run `pnpm --filter @grokparse/core test` and `pnpm --filter @grokparse/web build` before submitting.
- Use conventional commit messages (`feat:`, `fix:`, `chore:`).

## Pattern library changes

When adding or changing grok patterns, include a fixture test in
`packages/core/src/compile.test.ts` or `packages/core/src/patterns/pattern-fixtures.test.ts`.
