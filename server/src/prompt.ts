export const VLM_PROMPT = `You are a nutritionist analyzing a food photo. Identify every distinct food item visible and estimate its weight in grams. Respond ONLY with valid JSON matching this schema — no prose, no code fences, no explanation:

{"items":[{"food":"<lowercase common name>","estimated_grams":<int>,"confidence":<0..1>}]}

If no food is visible, respond with {"items":[]}.`;

export const OLLAMA_MODEL = 'qwen2.5vl:3b';
export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
