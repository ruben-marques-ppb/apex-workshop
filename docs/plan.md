# Implementation Plan

## Concept

Single-screen web app: user uploads a photo of a meal, a local vision LLM
identifies each food item and estimates portion sizes, backend looks each item
up in a USDA nutrition dataset and returns per-item calories + a grand total.
Stateless — no persistence, no tracking, no accounts.

## Feature scope (v1)

1. Drop or pick a photo → preview shown in the browser.
2. Client downscales the image to ≤1280px longest side before upload.
3. Click **Analyze** → spinner.
4. Backend receives image → forwards to Ollama Qwen2.5-VL 3B with a prompt
   requesting strict JSON output listing every visible food + estimated grams.
5. Backend fuzzy-matches each name to USDA SR Legacy → computes
   `calories = kcal_per_100g * grams / 100`.
6. Frontend displays a table of `{food, grams, kcal}` + grand total.
7. Prominent disclaimer that portion estimates are approximate.

Explicitly **out** of v1 (see [AGENTS.md](../AGENTS.md#what-this-project-is-not)).

## Repo layout

```
apex-workshop/
├── client/                 # React + TS + Vite + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/     # Dropzone, ResultsTable, Disclaimer, ...
│   │   └── lib/api.ts      # fetch wrapper for POST /api/analyze
│   ├── index.html
│   └── package.json
├── server/                 # Node + Express + TypeScript
│   ├── src/
│   │   ├── index.ts        # express bootstrap, /api/analyze route
│   │   ├── ollama.ts       # POST http://localhost:11434/api/generate
│   │   ├── prompt.ts       # VLM prompt template (single source of truth)
│   │   ├── usda.ts         # load SR Legacy JSON, build Fuse.js index, lookup
│   │   ├── analyze.ts      # orchestration: image → VLM → lookup → response
│   │   └── types.ts
│   ├── src/__tests__/      # node:test files
│   └── package.json
├── data/                   # SR Legacy JSON (gitignored, downloaded by script)
├── scripts/
│   └── download-usda.sh    # curls SR Legacy JSON into data/
├── docs/
│   ├── plan.md             # this file
│   └── decisions.md        # design rationale + locked decisions
├── package.json            # root: concurrently, npm scripts
├── AGENTS.md               # context for AI agents
└── README.md
```

## API contract

### `POST /api/analyze`

- **Request:** `multipart/form-data`, field `image` (jpeg/png, max ~10MB)
- **Response 200:**
  ```json
  {
    "items": [
      {
        "food": "cheeseburger",
        "matchedUsda": "Fast foods, cheeseburger; single, regular patty, plain",
        "grams": 180,
        "kcal": 540,
        "confidence": 0.82
      },
      {
        "food": "french fries",
        "matchedUsda": "Fast foods, potato, french fried in vegetable oil",
        "grams": 100,
        "kcal": 312,
        "confidence": 0.90
      }
    ],
    "totalKcal": 852,
    "warnings": []
  }
  ```
- **Response error:**
  ```json
  { "error": "ollama_unreachable" }
  ```
  Stable string enum. Known values:
  - `ollama_unreachable` — HTTP to `localhost:11434` failed
  - `vlm_bad_json` — model returned unparseable output after one retry
  - `no_food_detected` — VLM returned an empty items array
  - `image_too_large` — request body over the configured limit
  - `internal_error` — anything else

## VLM prompt (draft — canonical version lives in `server/src/prompt.ts`)

```
You are a nutritionist analyzing a food photo. Identify every distinct food
item visible and estimate its weight in grams. Respond ONLY with valid JSON
matching this schema — no prose, no code fences, no explanation:

{
  "items": [
    {"food": "<lowercase common name>", "estimated_grams": <int>, "confidence": <0..1>}
  ]
}

If no food is visible, respond with {"items": []}.
```

## Edge cases (handle in implementation without asking)

- **No USDA match** for an identified food → include the row with `kcal: null`,
  add a human-readable string to `warnings`, exclude from `totalKcal`.
- **VLM returns invalid JSON** → retry once. If still bad, respond with
  `{"error": "vlm_bad_json"}` and log the raw output server-side.
- **Ollama unreachable** → `{"error": "ollama_unreachable"}`; client renders
  a banner explaining how to start Ollama and pull the model.
- **Huge image from phone** → client downscales to ≤1280px longest side before
  upload (faster VLM inference, smaller network payload). Server also enforces
  a size cap as a safety net.
- **Empty result** (LLM sees no food) → `{"error": "no_food_detected"}`,
  client shows "No food detected — try another photo".

## Milestones

1. **Scaffold** ✅ — repo skeleton, Vite client, Express server, `npm run dev`
   at the root runs both via `concurrently`. Health-check endpoint returns 200.
2. **USDA pipeline** ✅ — `scripts/download-usda.sh`, `server/src/usda.ts` loads
   the JSON, builds a Fuse.js index, exports a `lookupCalories(name)` fn.
   `node:test` unit tests cover happy path and no-match (4 passing).
3. **Ollama integration** ✅ — `/api/analyze` end-to-end. Verified live with
   Qwen2.5-VL 3B: ~3s round-trip on a small image, JSON parsing works,
   `no_food_detected` path works.
4. **Frontend UX** ✅ — dropzone, preview, client-side downscale, Analyze
   button, results table, disclaimer, error banner per error enum.
5. **Polish** 🚧 — remaining tuning work below.

## Next steps (post-scaffold tuning)

- **Fuse.js threshold + filtering.** Current `threshold: 0.4` produces
  surprising matches (observed: "cola" → "white chocolate"). Options:
  tighten threshold to ~0.3, weight by description length, or pre-filter
  the SR Legacy corpus to a curated subset (drop obscure branded entries).
- **VLM output stability.** Watch how often the model wraps JSON in code
  fences or adds prose despite `format: 'json'`. If frequent, tune the
  prompt further; if rare, current single-retry is fine.
- **Loading feedback.** First inference is 5–15s (model warmup). Consider a
  progress hint or a warmup ping on server boot.
- **README verification pass.** Follow the setup steps from a clean clone
  on a second machine to catch missing docs.
- **Optional v2 ideas** (per [decisions.md](decisions.md)): editable rows,
  embeddings-based matching, multi-item cropping preview.
