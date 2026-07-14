import type { AnalyzeItem } from './api.js';

export const HISTORY_KEY = 'apex-workshop:history:v1';
const MAX_THUMB_EDGE = 256;

export type HistoryEntry = {
  id: string;
  createdAt: string;
  thumbnailDataUrl: string;
  items: AnalyzeItem[];
  totalKcal: number;
  warnings: string[];
};

export type AddEntryResult = { ok: true } | { ok: false; warning: 'quota_exceeded' };

export function getEntries(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function addEntry(entry: HistoryEntry): AddEntryResult {
  const entries = [entry, ...getEntries()];
  let dropped = 0;
  while (entries.length > 0) {
    try {
      saveEntries(entries);
      return dropped > 0 ? { ok: false, warning: 'quota_exceeded' } : { ok: true };
    } catch (err) {
      const name = err instanceof Error ? (err as DOMException).name : '';
      if (name === 'QuotaExceededError' && entries.length > 1) {
        entries.pop();
        dropped++;
      } else {
        throw err;
      }
    }
  }
  return { ok: false, warning: 'quota_exceeded' };
}

export function deleteEntry(id: string): void {
  saveEntries(getEntries().filter((e) => e.id !== id));
}

export function clearAll(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function createThumbnailDataUrl(file: File): Promise<string> {
  return createImageBitmap(file).then((bitmap) => {
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_THUMB_EDGE / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    return canvas.toDataURL('image/jpeg', 0.75);
  });
}
