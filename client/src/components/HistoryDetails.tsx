import { useEffect } from 'react';
import type { HistoryEntry } from '../lib/history.js';
import { ResultsTable } from './ResultsTable.js';
import type { AnalyzeResponse } from '../lib/api.js';

type Props = {
  entry: HistoryEntry;
  onClose: () => void;
};

export function HistoryDetails({ entry, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const data: AnalyzeResponse = {
    items: entry.items,
    totalKcal: entry.totalKcal,
    warnings: entry.warnings,
  };

  const date = new Date(entry.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold">Analysis details</h2>
            <p className="text-xs text-slate-500 mt-0.5">{date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={entry.thumbnailDataUrl}
              alt="meal photo"
              className="w-full max-h-64 object-contain"
            />
          </div>
          <ResultsTable data={data} />
        </div>
      </div>
    </div>
  );
}
