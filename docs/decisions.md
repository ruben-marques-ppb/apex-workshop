# Design Decisions

Lightweight ADR log. Each entry captures a decision made during design, the
options considered, and *why* the chosen option won. If you're an agent
resuming the project and want to change one of these, read the "why" first —
these were resolved deliberately, not by default.

---

## 1. Platform: Web SPA

**Options:** Web SPA · Mobile app · CLI · Desktop (Electron/Tauri)
**Chosen:** Web SPA.
**Why:** Fastest to iterate, easiest to demo, matches existing JS/Node
tooling. Native mobile would fit the "log what I ate" use case better but is
10× the work and out of scope for a workshop.

## 2. Frontend stack: React + TypeScript + Vite

**Options:** React+TS+Vite · Svelte · Vue · Plain HTML/JS · Next.js
**Chosen:** React + TS + Vite.
**Why:** Instant HMR, TS catches data-shape bugs (important with messy USDA
data), React is the default extension surface. No SSR needed — this is a
local tool.

## 3. Backend: Node + Express + SQLite → **Node + Express (no DB)**

**Options originally considered:** client-only · Node+Express+SQLite · Supabase/Firebase
**Initial choice:** Node + Express + SQLite.
**Revised (after scope cut in #5):** Node + Express, **no database**.
**Why revised:** With no persistence in scope, there is nothing to store. The
backend remains as a thin proxy that hides the Ollama API surface, owns the
prompt, and does USDA lookup / calorie math.

## 4. Auth: none, single user

**Options:** none · email/password · OAuth
**Chosen:** none.
**Why:** Adding auth is a large surface (hashing, sessions, JWT, reset flows)
that adds no learning value for this workshop and blocks the interesting
part (image → calories). Can be added later without redesigning the domain.

## 5. Scope: image → calories only, no tracking (v1) → history added (v2)

**Options:** core CRUD calorie log · goals · history · macros · custom foods
**v1 chosen:** *none of the above*. App is stateless: photo in → totals out.
**Why (v1):** User explicitly narrowed scope to "identify food elements and total
calories from a food photo." This eliminates the DB, auth, log UI, history
UI, and >50% of the code we'd otherwise write.

**v2 scope expansion (issue #1):** Client-side `localStorage` history added per
user request. Stays true to the "fully local, no accounts, no backend DB"
principle — history lives in the browser only and survives page reloads. Cross-
device sync and CSV export remain explicitly out of scope.

## 14. History persistence: localStorage (client-only)

**Options:** localStorage · IndexedDB · backend SQLite · no history
**Chosen:** localStorage.
**Why:** Simplest API that satisfies "offline, no accounts, no backend." Entries
are small after JPEG thumbnail downscaling (≤256px, q=0.75). QuotaExceededError
is handled by evicting oldest entries. IndexedDB would be more robust at scale
but adds async complexity for a feature that's secondary to the core flow.

## 6. Recognition approach: Ollama VLM (Qwen2.5-VL 3B)

**Options:** CLIP zero-shot (browser) · Food-101 classifier · YOLO food ·
Moondream 1.8B · Qwen2.5-VL 3B · Qwen2.5-VL 7B
**Chosen:** Qwen2.5-VL 3B via Ollama, called from the Node backend.
**Why:** User wants free-form output — "identify + estimate portion" — which
a classifier can't produce. Qwen2.5-VL 3B is the best quality/size tradeoff
that runs comfortably on Apple Silicon with 3–8GB RAM headroom. Moondream is
faster but noticeably weaker; 7B is better but ~2× the memory. If accuracy
disappoints, upgrade to 7B — no code change beyond the model tag.

## 7. VLM output contract: multi-item strict JSON

**Options:** identify only · identify + one portion · full JSON multi-item
**Chosen:** full JSON multi-item array.
**Why:** A "food photo" is typically a plate with multiple items
(burger + fries + drink). Anything less makes the app a toy. Strict JSON
(vs prose) is non-negotiable because we parse it — enforce with prompt
discipline and a single retry on parse failure.

## 8. Nutrition dataset: USDA FoodData Central — SR Legacy

**Options:** MyPyramid raw data · SR Legacy JSON · Foundation Foods · FDC REST API
**Chosen:** SR Legacy JSON, bundled server-side.
**Why:** MyPyramid (from the original brief) is a 2005-era Excel file that
needs manual transformation. SR Legacy is the modern successor, downloadable
as JSON, ~8k common foods, ~15MB — small enough to bundle. Foundation Foods
is too small (~200 curated items) for real photo coverage. The REST API
would work but requires internet + an API key, which contradicts the
"fully local" goal.

## 9. Food-name matching: Fuse.js

**Options:** Fuse.js · embeddings (nomic-embed-text) · fuzzy prefilter + LLM pick · prompt-engineered exact match
**Chosen:** Fuse.js.
**Why:** Simplest thing that could work. If accuracy is disappointing on
real photos, embeddings via Ollama's `nomic-embed-text` is a drop-in upgrade
(swap the lookup function, keep the API). Don't over-engineer before we've
seen real failures.

## 10. UI flow: analyze-only, read-only results

**Options:** analyze-only read-only · analyze + editable rows · auto-analyze on drop
**Chosen:** analyze-only, read-only.
**Why:** User's preference — matches the "one-shot demo" scope. **Trade-off
noted honestly:** VLMs misidentify and portion estimation is unreliable, so
without editability the tool is a demo, not a usable calorie counter. UI
must show a prominent disclaimer. If real use surfaces frustration, add
editable rows in v2 (a small refactor).

## 11. Ollama bootstrap: README instructions only

**Options:** README only · bootstrap script · backend auto-pull on startup
**Chosen:** README only.
**Why:** `ollama pull` is idempotent and takes one command. Auto-pulling
inside `npm run dev` would hide a ~5-minute 3GB download inside a
"start the app" command, which is surprising and hard to debug when it
fails on a flaky network.

## 12. Styling: shadcn/ui + Tailwind

**Options:** shadcn/ui+Tailwind · Tailwind alone · plain CSS · Chakra · MUI
**Chosen:** shadcn/ui + Tailwind.
**Why:** ~4 components needed (Button, Dropzone, Table, Toast). shadcn gives
accessible, good-looking components as copy-pasted source (no runtime dep),
Tailwind handles the rest. Chakra/MUI are heavier than the app itself.

## 13. Repo layout: flat `client/` + `server/`

**Options:** flat two-folder · npm workspaces monorepo · single package (server serves built client)
**Chosen:** flat two-folder with root `concurrently`.
**Why:** Simplest for a two-package app. Workspaces add ceremony we don't
need until we share code between client and server (we don't yet). Serving
the built client from Express conflates concerns and makes HMR annoying
during development.
