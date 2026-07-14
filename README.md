# Calorie Counter from a Food Photo

Single-screen web app: drop a photo of a meal, get a per-item and total
calorie estimate. Recognition runs **fully locally** via
[Ollama](https://ollama.com) using the Qwen2.5-VL vision model. Nutrition data
comes from USDA FoodData Central.

Stateless — no accounts, no database, no history. It's a workshop project.

## Status

Not built yet — see [docs/plan.md](docs/plan.md) for the implementation plan
and [docs/decisions.md](docs/decisions.md) for the design rationale.

## Setup

### Prerequisites

- macOS on Apple Silicon (M1/M2/M3/M4) or any machine that can run Ollama
- Node.js 20+
- [Ollama](https://ollama.com/download) installed and running

### One-time setup

1. **Ollama + vision model** — follow [docs/ollama-setup.md](docs/ollama-setup.md).
   You can do this in parallel with the rest of the build; it takes ~5
   minutes plus a 3 GB download.
2. **App dependencies** (once the code exists):
   ```bash
   npm install
   npm run data:download   # fetches USDA SR Legacy JSON (~15 MB)
   ```

### Run

```bash
npm run dev
```

Opens the client on <http://localhost:5173> and the API server on
<http://localhost:3000>.

## How it works

1. User drops a photo in the browser. The client downscales it to ≤1280px and
   POSTs it to `/api/analyze`.
2. The Express server forwards the image to Ollama running Qwen2.5-VL 3B, with
   a prompt asking for strict JSON: a list of foods and estimated grams.
3. Each identified food is fuzzy-matched (Fuse.js) against the USDA SR Legacy
   dataset to find calories per 100g.
4. Server returns items + grand total. Client renders a read-only table.

**Accuracy caveat:** vision models misidentify foods and portion estimates
from a single 2D photo are unreliable. Expect ±30–50% error. Not a diet tool.

## Repo layout

```
apex-workshop/
├── client/          React + TS + Vite + Tailwind + shadcn/ui
├── server/          Node + Express + TypeScript (thin, stateless)
├── data/            USDA SR Legacy JSON (gitignored, downloaded by script)
├── scripts/         Setup helpers
├── docs/            Plan, decisions, agent context
└── AGENTS.md        Read this if you're an AI agent picking up the project
```

## For AI agents resuming this project

Read [AGENTS.md](AGENTS.md) first, then [docs/plan.md](docs/plan.md).
