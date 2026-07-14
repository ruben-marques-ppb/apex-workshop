---
mode: agent
description: Tune Fuse.js food-name matching against USDA SR Legacy.
---

Goal: improve the quality of matches in `server/src/usda.ts` without changing
the public `lookupCalories(name)` signature.

Steps:
1. Read `server/src/usda.ts` and the existing tests in
   `server/src/__tests__/`.
2. Reproduce the known bad match: `"cola"` currently matches
   `"white chocolate"` with `threshold: 0.4`.
3. Try, in order, and keep the change that helps most:
   - Lower `threshold` toward `0.3`.
   - Add `keys` weighting that favours shorter descriptions.
   - Pre-filter obviously irrelevant SR Legacy entries at load time.
4. Add a `node:test` case that pins the fix (e.g. `"cola"` must not resolve
   to a chocolate entry).
5. Run `npm --prefix server test` and report before/after behaviour for a
   handful of common foods: `cola`, `cheeseburger`, `french fries`, `apple`,
   `rice`.

Do not add new dependencies. Do not change the response shape.
