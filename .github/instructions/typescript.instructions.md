---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript conventions

- TypeScript only. No `.js` source files anywhere in `client/` or `server/`.
- Prefer `type` aliases for shapes; use `interface` only when declaration
  merging is actually needed.
- Server-side error responses use the stable string enum documented in
  [docs/plan.md](../../docs/plan.md#post-apianalyze). Do not invent new
  error strings without updating the plan.
- Shared shapes (API request/response) live in `server/src/types.ts`. If the
  client needs them, copy the minimum — do not add a shared package.
- No default exports for modules that export more than one thing.
- Avoid `any`. Use `unknown` and narrow.
