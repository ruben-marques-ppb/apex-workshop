import { useCallback, useEffect, useState } from 'react';
import { Disclaimer } from './components/Disclaimer.js';
import { Dropzone } from './components/Dropzone.js';
import { ErrorBanner } from './components/ErrorBanner.js';
import { HistoryTable } from './components/HistoryTable.js';
import { ResultsTable } from './components/ResultsTable.js';
import { analyzeImage, type AnalyzeResult } from './lib/api.js';
import { downscaleImage } from './lib/downscale.js';
import {
  addEntry,
  clearAll,
  createThumbnailDataUrl,
  deleteEntry,
  getEntries,
  type HistoryEntry,
} from './lib/history.js';

type Status =
  | { kind: 'idle' }
  | { kind: 'ready'; file: File; previewUrl: string }
  | { kind: 'analyzing'; file: File; previewUrl: string }
  | { kind: 'done'; result: AnalyzeResult; previewUrl: string };

type Tab = 'analyze' | 'history';

export default function App() {
  const [tab, setTab] = useState<Tab>('analyze');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [history, setHistory] = useState<HistoryEntry[]>(() => getEntries());
  const [quotaWarning, setQuotaWarning] = useState<number>(0);

  useEffect(() => {
    if (!quotaWarning) return;
    const id = setTimeout(() => setQuotaWarning(0), 5000);
    return () => clearTimeout(id);
  }, [quotaWarning]);

  const onFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setStatus({ kind: 'ready', file, previewUrl });
  }, []);

  const onAnalyze = useCallback(async () => {
    if (status.kind !== 'ready') return;
    const { file, previewUrl } = status;
    setStatus({ kind: 'analyzing', file, previewUrl });
    const downscaled = await downscaleImage(file);
    const result = await analyzeImage(downscaled);
    setStatus({ kind: 'done', result, previewUrl });

    if (result.ok) {
      const thumbnailDataUrl = await createThumbnailDataUrl(file);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        thumbnailDataUrl,
        items: result.data.items,
        totalKcal: result.data.totalKcal,
        warnings: result.data.warnings,
      };
      const saved = addEntry(entry);
      if (!saved.ok) setQuotaWarning(saved.dropped);
      setHistory(getEntries());
    }
  }, [status]);

  const onReset = useCallback(() => {
    if (status.kind !== 'idle') URL.revokeObjectURL(status.previewUrl);
    setStatus({ kind: 'idle' });
  }, [status]);

  const onDelete = useCallback((id: string) => {
    deleteEntry(id);
    setHistory(getEntries());
  }, []);

  const onClearAll = useCallback(() => {
    clearAll();
    setHistory([]);
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="pt-4">
        <h1 className="text-3xl font-bold tracking-tight">Calorie Counter</h1>
        <p className="text-slate-600 mt-1">
          Drop a photo of a meal, get an estimated calorie total. Runs entirely on your machine.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('analyze')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'analyze'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Analyze
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          History
          {history.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5">
              {history.length}
            </span>
          )}
        </button>
      </nav>

      {quotaWarning > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5">
          ⚠ Storage quota reached — {quotaWarning} oldest {quotaWarning === 1 ? 'entry was' : 'entries were'} removed to make room.
        </div>
      )}

      {tab === 'analyze' && (
        <>
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
        </>
      )}

      {tab === 'history' && (
        <HistoryTable entries={history} onDelete={onDelete} onClearAll={onClearAll} />
      )}

      <footer className="pt-8 text-center text-xs text-slate-400">
        Local Qwen2.5-VL via Ollama · USDA FoodData Central SR Legacy
      </footer>
    </main>
  );
}
