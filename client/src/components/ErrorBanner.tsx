import type { ErrorCode } from '../lib/api.js';

const MESSAGES: Record<ErrorCode, { title: string; body: string }> = {
  ollama_unreachable: {
    title: 'Cannot reach Ollama',
    body:
      'The local Ollama server did not respond. Start it with `ollama serve` (or launch the Ollama app), then pull the model with `ollama pull qwen2.5vl:3b`.',
  },
  vlm_bad_json: {
    title: 'The vision model returned unparseable output',
    body: 'The model responded with something we could not parse as JSON, even after a retry. Try a different photo.',
  },
  no_food_detected: {
    title: 'No food detected',
    body: 'The model did not see any food in this photo. Try another one, or check the image is clear.',
  },
  image_too_large: {
    title: 'Image too large',
    body: 'This image is over the 12 MB limit. Try a smaller file.',
  },
  internal_error: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred on the server. Check the terminal running the API for details.',
  },
};

export function ErrorBanner({ code, message }: { code: ErrorCode; message?: string }) {
  const { title, body } = MESSAGES[code];
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm mt-1">{body}</div>
      {message && <div className="text-xs text-red-700 mt-2 font-mono break-all">{message}</div>}
    </div>
  );
}
