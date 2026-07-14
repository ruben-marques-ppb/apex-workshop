import { OLLAMA_MODEL, OLLAMA_URL, VLM_PROMPT } from './prompt.js';
import type { VlmItem } from './types.js';

export class OllamaError extends Error {
  constructor(
    public code: 'unreachable' | 'bad_json',
    message: string,
  ) {
    super(message);
  }
}

/**
 * Call Ollama's vision model with a base64 image. Returns the parsed VLM items.
 * Retries once on JSON parse failure.
 */
export async function analyzeImageWithOllama(imageBase64: string): Promise<VlmItem[]> {
  const rawFirst = await callOllama(imageBase64);
  try {
    return parseVlmResponse(rawFirst);
  } catch {
    // one retry with a stricter reminder
    const rawSecond = await callOllama(imageBase64, true);
    try {
      return parseVlmResponse(rawSecond);
    } catch {
      throw new OllamaError('bad_json', `VLM returned unparseable output: ${rawSecond.slice(0, 200)}`);
    }
  }
}

async function callOllama(imageBase64: string, strict = false): Promise<string> {
  const prompt = strict
    ? `${VLM_PROMPT}\n\nREMINDER: Output ONLY the raw JSON object. No prose. No code fences.`
    : VLM_PROMPT;

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        images: [imageBase64],
        stream: false,
        format: 'json',
      }),
    });
  } catch (err) {
    throw new OllamaError('unreachable', `Cannot reach Ollama at ${OLLAMA_URL}: ${(err as Error).message}`);
  }

  if (!res.ok) {
    throw new OllamaError('unreachable', `Ollama responded ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as { response?: string };
  return body.response ?? '';
}

function parseVlmResponse(raw: string): VlmItem[] {
  // Tolerate ```json fences that models sometimes add despite instructions.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as { items?: unknown };
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('missing items array');
  }

  return parsed.items
    .filter((it): it is VlmItem => {
      if (!it || typeof it !== 'object') return false;
      const o = it as Record<string, unknown>;
      return (
        typeof o.food === 'string' &&
        typeof o.estimated_grams === 'number' &&
        typeof o.confidence === 'number'
      );
    })
    .map((it) => ({
      food: it.food.toLowerCase().trim(),
      estimated_grams: Math.max(0, Math.round(it.estimated_grams)),
      confidence: Math.max(0, Math.min(1, it.confidence)),
    }));
}
