---
mode: agent
description: Add a new typed error to /api/analyze end-to-end.
---

Add a new error enum value to `/api/analyze` and wire it through the client.

Inputs you must ask the user for if not provided:
- The error string (snake_case, e.g. `image_unsupported_format`).
- The trigger condition (what server-side check produces it).
- The user-facing message the client should render.

Steps:
1. Add the enum value to `server/src/types.ts` and the docs table in
   [docs/plan.md](../../docs/plan.md#post-apianalyze).
2. Emit it from the appropriate place in `server/src/analyze.ts` (or
   `ollama.ts` / `usda.ts` if that's where the condition is detected).
3. Add a `node:test` covering the new branch.
4. Handle it in the client error banner component under `client/src/components/`.
5. Run both test suites and `npm run build`.

Do not silently swallow other errors. Do not change existing enum values —
they are a stable contract.
