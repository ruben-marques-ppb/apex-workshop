---
applyTo: "**/__tests__/**,**/*.test.ts,**/*.test.tsx"
---

# Testing conventions

- Use the Node built-in test runner (`node:test` + `node:assert/strict`).
  Do **not** add jest, vitest, mocha, chai, or sinon.
- Test files live under `src/__tests__/` and end in `.test.ts` / `.test.tsx`.
- Keep tests fast and offline. Do not hit Ollama or the network in unit tests
  — stub the `ollama.ts` module instead.
- One behaviour per test. Name tests as sentences: `test('returns null when
  no USDA match', ...)`.
- Run with `npm --prefix server test` or `npm --prefix client test`.
