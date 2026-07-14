import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { buildAnalyzeResponse } from './analyze.js';
import { OllamaError, analyzeImageWithOllama } from './ollama.js';
import type { ErrorResponse, VlmItem } from './types.js';

const PORT = Number(process.env.PORT ?? 3000);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB
const USE_FAKE_VLM = process.env.USE_FAKE_VLM === '1';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, fakeVlm: USE_FAKE_VLM });
});

app.post('/api/analyze', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return sendError(res, 400, 'internal_error', 'Missing "image" file field.');
  }

  try {
    const vlmItems = USE_FAKE_VLM
      ? fakeVlmItems()
      : await analyzeImageWithOllama(req.file.buffer.toString('base64'));

    if (vlmItems.length === 0) {
      return sendError(res, 200, 'no_food_detected');
    }

    const response = buildAnalyzeResponse(vlmItems);
    res.json(response);
  } catch (err) {
    if (err instanceof OllamaError) {
      const code = err.code === 'unreachable' ? 'ollama_unreachable' : 'vlm_bad_json';
      return sendError(res, 503, code, err.message);
    }
    console.error('[analyze] unexpected error:', err);
    sendError(res, 500, 'internal_error', (err as Error).message);
  }
});

// multer error handler (e.g. LIMIT_FILE_SIZE)
app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 413, 'image_too_large', `Max upload size is ${MAX_IMAGE_BYTES} bytes.`);
  }
  console.error('[express] unexpected error:', err);
  sendError(res, 500, 'internal_error', (err as Error).message);
});

app.listen(PORT, () => {
  console.log(`✓ API server listening on http://localhost:${PORT}`);
  if (USE_FAKE_VLM) console.log('  (USE_FAKE_VLM=1 — Ollama not called)');
});

function sendError(res: Response, status: number, error: ErrorResponse['error'], message?: string) {
  const body: ErrorResponse = { error, ...(message ? { message } : {}) };
  res.status(status).json(body);
}

function fakeVlmItems(): VlmItem[] {
  return [
    { food: 'cheeseburger', estimated_grams: 180, confidence: 0.85 },
    { food: 'french fries', estimated_grams: 100, confidence: 0.9 },
    { food: 'cola', estimated_grams: 250, confidence: 0.8 },
  ];
}
