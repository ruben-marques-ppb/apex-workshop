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

1. **Scaffold** — repo skeleton, Vite client, Express server, `npm run dev`
   at the root runs both via `concurrently`. Health-check endpoint returns 200.
2. **USDA pipeline** — `scripts/download-usda.sh`, `server/src/usda.ts` loads
   the JSON, builds a Fuse.js index, exports a `lookupCalories(name)` fn.
   Add a `node:test` unit test covering happy path and no-match.
3. **Ollama integration** — `/api/analyze` end-to-end using a hard-coded local
   test image. Verifies prompt, JSON parsing, retry, error mapping.
4. **Frontend UX** — dropzone, preview, downscale, Analyze button, results
   table, disclaimer, error banner for each error enum value.
5. **Polish** — loading spinner, empty states, README setup steps verified by
   following them from a clean clone.
