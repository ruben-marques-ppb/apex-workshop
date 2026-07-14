# Copilot instructions — apex-workshop

Single-screen web app that estimates calories from a food photo using a
local vision LLM. **Stateless.** No accounts, no DB, no history.

Before coding, read [AGENTS.md](../AGENTS.md) and [docs/plan.md](../docs/plan.md).
Design rationale lives in [docs/decisions.md](../docs/decisions.md).

## Stack (locked — do not change without asking)

- **Client:** React + TypeScript + Vite + Tailwind + shadcn/ui (`client/`)
- **Server:** Node + Express + TypeScript, stateless (`server/`)
- **Vision:** Ollama running `qwen2.5vl:3b` at `localhost:11434`
- **Nutrition:** USDA SR Legacy JSON in `data/`, matched with Fuse.js
- **Tests:** `node:test` only — no jest/vitest/mocha
- **Runner:** `npm run dev` at the repo root (uses `concurrently`)

## Do

- Write TypeScript everywhere. No `.js` source files.
- Keep the VLM prompt in `server/src/prompt.ts` (single source of truth).
- Return typed error enums from `/api/analyze`: `ollama_unreachable`,
  `vlm_bad_json`, `no_food_detected`, `image_too_large`, `internal_error`.
- Prefer small, boring dependencies.
- Ask before adding new tools, frameworks, or scope.

## Don't

Anything in [AGENTS.md § What this project is NOT](../AGENTS.md#what-this-project-is-not):
accounts, DB, history/logging, macros, editable results, auto-analyze on drop,
cloud APIs. Treat these as v2 and confirm before implementing.

## Common commands

```bash
npm run dev            # run client + server together
npm --prefix server test
npm --prefix client test
npm run build
```
