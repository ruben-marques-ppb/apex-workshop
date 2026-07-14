import { useState } from 'react';
import type { HistoryEntry } from '../lib/history.js';
import { HistoryDetails } from './HistoryDetails.js';

type Props = {
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function foodSummary(entry: HistoryEntry): string {
  const names = entry.items.slice(0, 2).map((i) => i.food);
  const rest = entry.items.length - 2;
  return rest > 0 ? `${names.join(', ')} +${rest} more` : names.join(', ');
}

export function HistoryTable({ entries, onDelete, onClearAll }: Props) {
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        <p className="text-lg font-medium">No history yet.</p>
        <p className="text-sm mt-1">Analyze a photo and the results will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm text-slate-600 font-medium">{entries.length} saved analysis{entries.length !== 1 ? 'es' : ''}</span>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          ) : (
            <span className="text-xs flex items-center gap-2">
              <span className="text-slate-600">Are you sure?</span>
              <button
                onClick={() => { onClearAll(); setConfirmClear(false); }}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel
              </button>
            </span>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Photo</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Foods</th>
              <th className="text-right px-4 py-3">Total kcal</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <img
                    src={entry.thumbnailDataUrl}
                    alt="meal thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  />
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-700 capitalize">
                  {foodSummary(entry)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {entry.totalKcal}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex gap-3 items-center">
                    <button
                      onClick={() => setSelected(entry)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </button>
                    {confirmDeleteId !== entry.id ? (
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="text-red-500 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="inline-flex gap-2 items-center text-xs">
                        <span className="text-slate-600">Sure?</span>
                        <button
                          onClick={() => { onDelete(entry.id); setConfirmDeleteId(null); }}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-slate-500 hover:text-slate-700 font-medium"
                        >
                          Cancel
                        </button>
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <HistoryDetails entry={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
