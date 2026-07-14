import type { AnalyzeResponse } from '../lib/api.js';

export function ResultsTable({ data }: { data: AnalyzeResponse }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">Food</th>
            <th className="text-left px-4 py-3">Matched USDA entry</th>
            <th className="text-right px-4 py-3">Grams</th>
            <th className="text-right px-4 py-3">Calories</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium capitalize">{item.food}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {item.matchedUsda ?? <span className="italic">no match</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{item.grams}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                {item.kcal ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td className="px-4 py-3 font-semibold" colSpan={3}>Total</td>
            <td className="px-4 py-3 text-right font-bold text-lg tabular-nums">
              {data.totalKcal} kcal
            </td>
          </tr>
        </tfoot>
      </table>

      {data.warnings.length > 0 && (
        <div className="border-t border-slate-100 bg-amber-50 text-amber-800 text-xs p-3">
          {data.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}
    </div>
  );
}
