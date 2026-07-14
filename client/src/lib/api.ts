export type AnalyzeItem = {
  food: string;
  matchedUsda: string | null;
  grams: number;
  kcal: number | null;
  confidence: number;
};

export type AnalyzeResponse = {
  items: AnalyzeItem[];
  totalKcal: number;
  warnings: string[];
};

export type ErrorCode =
  | 'ollama_unreachable'
  | 'vlm_bad_json'
  | 'no_food_detected'
  | 'image_too_large'
  | 'internal_error';

export type AnalyzeResult =
  | { ok: true; data: AnalyzeResponse }
  | { ok: false; error: ErrorCode; message?: string };

export async function analyzeImage(file: Blob): Promise<AnalyzeResult> {
  const form = new FormData();
  form.append('image', file);

  let res: Response;
  try {
    res = await fetch('/api/analyze', { method: 'POST', body: form });
  } catch (err) {
    return { ok: false, error: 'ollama_unreachable', message: (err as Error).message };
  }

  const body = (await res.json()) as
    | AnalyzeResponse
    | { error: ErrorCode; message?: string };

  if ('error' in body) {
    return { ok: false, error: body.error, message: body.message };
  }
  return { ok: true, data: body };
}
