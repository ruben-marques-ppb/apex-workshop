# Ollama Setup

Follow this once, in parallel with the rest of the build. When the app is
ready, everything below should already be in place on your machine.

Target: macOS on Apple Silicon (M1/M2/M3/M4). Model: **Qwen2.5-VL 3B**
(~3 GB download).

---

## 1. Install Ollama

**Option A — Homebrew (recommended):**

```bash
brew install --cask ollama
```

**Option B — direct download:**

<https://ollama.com/download/mac> → download the `.dmg` → drag to Applications.

After install, launch Ollama once from Applications so it registers the
background service. You should see a llama icon in the menu bar.

## 2. Verify Ollama is running

```bash
curl http://localhost:11434/api/tags
```

Expected: JSON response like `{"models":[]}` (empty list is fine — we haven't
pulled anything yet).

If `curl` fails with "connection refused":

```bash
# Start the server manually in a terminal (leave it running):
ollama serve
```

The Applications launcher usually starts this automatically; running
`ollama serve` when it's already running is harmless — it just fails to bind.

## 3. Pull the vision model

```bash
ollama pull qwen2.5vl:3b
```

This downloads ~3 GB. Grab a coffee. When it finishes:

```bash
ollama list
```

You should see `qwen2.5vl:3b` in the output.

## 4. Smoke-test the model on an image

Save any food photo to `~/Downloads/test.jpg`, then:

```bash
# The Ollama CLI supports passing an image as a second arg to `ollama run`:
ollama run qwen2.5vl:3b "What food is in this image? Reply in one short sentence." ~/Downloads/test.jpg
```

Expected: a plain-English answer identifying the food. Example:

> The image shows a cheeseburger with french fries on a plate.

If you get an answer, you're done. The Node backend we build later will hit
the same model via `POST http://localhost:11434/api/generate`.

## 5. (Optional) Try the JSON prompt we'll actually use

This is the exact style of prompt the app will send. Handy to eyeball how
well the model behaves on your photos before wiring it up.

```bash
ollama run qwen2.5vl:3b 'You are a nutritionist analyzing a food photo. Identify every distinct food item visible and estimate its weight in grams. Respond ONLY with valid JSON matching this schema — no prose, no code fences, no explanation:

{"items":[{"food":"<lowercase common name>","estimated_grams":<int>,"confidence":<0..1>}]}

If no food is visible, respond with {"items":[]}.' ~/Downloads/test.jpg
```

Expected: strict JSON, e.g.

```json
{"items":[{"food":"cheeseburger","estimated_grams":180,"confidence":0.85},{"food":"french fries","estimated_grams":100,"confidence":0.9}]}
```

If it wraps the JSON in code fences or adds prose, that's fine — the backend
handles that with a single retry. If it consistently refuses to output JSON,
tell me and we'll adjust the prompt.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl: (7) Failed to connect to localhost port 11434` | Run `ollama serve` in a spare terminal, or launch Ollama from Applications. |
| `Error: pull model manifest: file does not exist` | Check the model tag: it's `qwen2.5vl:3b` (colon, not dash). Run `ollama pull qwen2.5vl:3b` again. |
| Model runs but is extremely slow (>30s per image) | You may be swapping to disk. Close other memory-hungry apps, or try the smaller `moondream:1.8b` as a fallback while iterating. |
| Model output is prose, not JSON | Expected occasionally — the backend retries once. If it's every time, share a sample with me. |
| `qwen2.5vl:3b` doesn't exist on your Ollama version | Update Ollama: `brew upgrade --cask ollama`. Vision models require a recent release. |

---

## What to send me when you're done

Just "Ollama is set up, model responds" is enough. If you hit a snag, paste
the failing command + full output.
