---
name: ollama-smoke-test
description: Verifies that Ollama is reachable on localhost:11434 and that qwen2.5vl:3b is pulled and responsive. Use when /api/analyze returns ollama_unreachable, when onboarding a new machine, or before running the app for the first time.
---

# Ollama smoke test

Run these checks in order. Stop at the first failure and report it.

## 1. Daemon reachable

```bash
curl -sf http://localhost:11434/api/tags > /dev/null && echo "ollama: up" || echo "ollama: DOWN"
```

If down: tell the user to run `ollama serve` (or start the Ollama app) and
point them at `docs/ollama-setup.md`.

## 2. Model present

```bash
curl -s http://localhost:11434/api/tags | grep -q 'qwen2.5vl:3b' && echo "model: present" || echo "model: MISSING"
```

If missing: `ollama pull qwen2.5vl:3b` (~3 GB download).

## 3. Model responds

```bash
curl -s http://localhost:11434/api/generate \
  -d '{"model":"qwen2.5vl:3b","prompt":"reply with the single word: ok","stream":false}' \
  | grep -o '"response":"[^"]*"'
```

Should include `ok`. First call may take 5–15 s (model warmup).

## Report

Summarise: daemon status, model status, warmup latency. Do not modify any
project files.
