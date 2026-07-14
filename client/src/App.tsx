import { useCallback, useState } from 'react';
import { Disclaimer } from './components/Disclaimer.js';
import { Dropzone } from './components/Dropzone.js';
import { ErrorBanner } from './components/ErrorBanner.js';
import { ResultsTable } from './components/ResultsTable.js';
import { analyzeImage, type AnalyzeResult } from './lib/api.js';
import { downscaleImage } from './lib/downscale.js';

type Status =
  | { kind: 'idle' }
  | { kind: 'ready'; file: File; previewUrl: string }
  | { kind: 'analyzing'; file: File; previewUrl: string }
  | { kind: 'done'; result: AnalyzeResult; previewUrl: string };

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStatus({ kind: 'ready', file, previewUrl });
  }, []);

  const onAnalyze = useCallback(async () => {
    if (status.kind !== 'ready') return;
    setStatus({ kind: 'analyzing', file: status.file, previewUrl: status.previewUrl });
    const downscaled = await downscaleImage(status.file);
    const result = await analyzeImage(downscaled);
    setStatus({ kind: 'done', result, previewUrl: status.previewUrl });
  }, [status]);

  const onReset = useCallback(() => {
    if (status.kind !== 'idle') URL.revokeObjectURL(status.previewUrl);
    setStatus({ kind: 'idle' });
  }, [status]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="pt-4">
        <h1 className="text-3xl font-bold tracking-tight">Calorie Counter</h1>
        <p className="text-slate-600 mt-1">
          Drop a photo of a meal, get an estimated calorie total. Runs entirely on your machine.
        </p>
      </header>

      <Disclaimer />

      {status.kind === 'idle' && <Dropzone onFile={onFile} />}

      {status.kind !== 'idle' && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <img src={status.previewUrl} alt="preview" className="max-h-96 w-full object-contain bg-slate-100" />
          </div>

          <div className="flex gap-3">
            {status.kind === 'ready' && (
              <button
                onClick={onAnalyze}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5"
              >
                Analyze
              </button>
            )}
            {status.kind === 'analyzing' && (
              <button
                disabled
                className="rounded-lg bg-indigo-400 text-white font-medium px-5 py-2.5 cursor-wait"
              >
                Analyzing…
              </button>
            )}
            <button
              onClick={onReset}
              className="rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-5 py-2.5"
            >
              Choose another photo
            </button>
          </div>

          {status.kind === 'done' && status.result.ok && <ResultsTable data={status.result.data} />}
          {status.kind === 'done' && !status.result.ok && (
            <ErrorBanner code={status.result.error} message={status.result.message} />
          )}
        </div>
      )}

      <footer className="pt-8 text-center text-xs text-slate-400">
        Local Qwen2.5-VL via Ollama · USDA FoodData Central SR Legacy
      </footer>
    </main>
  );
}
