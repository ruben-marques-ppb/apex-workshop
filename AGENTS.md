# Agent Context

You are (probably) an AI coding agent resuming work on this project. Read this
file end-to-end before touching any code. It exists so you don't have to
re-derive the design.

## What this project is

A stateless web app that estimates calories from a photo of food using a
locally-hosted vision LLM. **Single screen. No persistence. No accounts.**
It is a workshop / learning project, not a production nutrition tool.

## What this project is NOT

Do not add any of the following without explicit user approval — they were
explicitly cut from scope during design:

- User accounts / auth
- A database (SQLite, Postgres, anything)
- Meal logging / history / daily totals
- Daily calorie goals or progress tracking
- Macros (protein/carbs/fat)
- Custom user-added foods
- Editable results (results are read-only; retry = pick a new photo)
- Auto-analyze on drop (an explicit "Analyze" button is required)
- Cloud APIs for nutrition or image recognition

If the user asks for one of these, treat it as a v2 request and confirm
before implementing.

## Locked architecture

| Area | Decision |
|---|---|
| Platform | Web SPA |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Node + Express + TypeScript, stateless |
| Persistence | None |
| Image recognition | Ollama running `qwen2.5vl:3b`, called from the backend |
| VLM output | Strict JSON: `{"items": [{"food", "estimated_grams", "confidence"}]}` |
| Nutrition dataset | USDA FoodData Central — **SR Legacy** JSON, bundled server-side |
| Food-name matching | Fuse.js fuzzy match against SR Legacy descriptions |
| Repo layout | Flat `client/` + `server/` + `data/`, root uses `concurrently` |
| Ollama bootstrap | README instructions only, no auto-pull |

Full rationale in [docs/decisions.md](docs/decisions.md). The concrete plan
and API contract are in [docs/plan.md](docs/plan.md).

## Conventions

- **TypeScript everywhere.** No `.js` source files.
- **Small, boring dependencies.** Prefer stdlib and one well-known library
  over a stack of clever ones.
- **Server owns the prompt.** The VLM prompt lives in `server/src/prompt.ts`,
  not scattered across files. Update [docs/plan.md](docs/plan.md) whenever
  you change it.
- **Errors are typed.** `/api/analyze` returns `{error: "ollama_unreachable" | "vlm_bad_json" | ...}` with a stable string enum so the client can render friendly messages.
- **No secrets, no cloud.** Everything runs on localhost. If you find
  yourself reaching for an API key, stop and ask.
- **Node built-in test runner.** If tests are added, use `node:test` (matches
  the apex-marketplace convention). Do not add jest/vitest/mocha.

## Milestones (from the plan)

1. Scaffold — repo skeleton, Vite client, Express server, root `npm run dev`
   runs both via `concurrently`.
2. USDA pipeline — download script + Fuse.js loader + a test for lookup.
3. Ollama integration — `/api/analyze` end-to-end with a hard-coded test image.
4. Frontend UX — dropzone, preview, Analyze button, results table, disclaimer.
5. Polish — error states, loading spinner, README setup verified end-to-end.

When resuming, check which milestone the repo is at (look at what's committed
and what's in each folder) before deciding what to do next.

## When in doubt

Ask the user rather than guess. Design branches were resolved by a grilling
session; any new branch (e.g. "should we add X?") deserves the same
treatment, not a silent choice.
