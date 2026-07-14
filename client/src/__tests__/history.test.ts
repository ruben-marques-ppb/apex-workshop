import { strict as assert } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { addEntry, clearAll, deleteEntry, getEntries, HISTORY_KEY, type HistoryEntry } from '../lib/history.js';

// ---------------------------------------------------------------------------
// Minimal localStorage mock (Map-backed, synchronous)
// ---------------------------------------------------------------------------
const _store = new Map<string, string>();
let _quotaError = false;

const mockLocalStorage = {
  getItem(key: string): string | null {
    return _store.has(key) ? _store.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    if (_quotaError) {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw err;
    }
    _store.set(key, value);
  },
  removeItem(key: string): void {
    _store.delete(key);
  },
  clear(): void {
    _store.clear();
  },
};

(globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    thumbnailDataUrl: 'data:image/jpeg;base64,//',
    items: [{ food: 'pizza', matchedUsda: null, grams: 200, kcal: 500, confidence: 0.9 }],
    totalKcal: 500,
    warnings: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('history storage helpers', () => {
  beforeEach(() => {
    _store.clear();
    _quotaError = false;
  });

  describe('getEntries', () => {
    it('returns empty array when nothing is stored', () => {
      assert.deepEqual(getEntries(), []);
    });

    it('returns parsed entries from localStorage', () => {
      const entry = makeEntry();
      _store.set(HISTORY_KEY, JSON.stringify([entry]));
      const result = getEntries();
      assert.equal(result.length, 1);
      assert.equal(result[0].id, entry.id);
    });

    it('returns empty array when stored JSON is corrupt', () => {
      _store.set(HISTORY_KEY, 'not-valid-json{');
      assert.deepEqual(getEntries(), []);
    });
  });

  describe('addEntry', () => {
    it('stores a new entry and returns ok:true', () => {
      const entry = makeEntry();
      const result = addEntry(entry);
      assert.equal(result.ok, true);
      const stored = getEntries();
      assert.equal(stored.length, 1);
      assert.equal(stored[0].id, entry.id);
    });

    it('prepends newer entries (newest first)', () => {
      const first = makeEntry({ id: 'first', createdAt: '2024-01-01T00:00:00Z' });
      const second = makeEntry({ id: 'second', createdAt: '2024-01-02T00:00:00Z' });
      addEntry(first);
      addEntry(second);
      const entries = getEntries();
      assert.equal(entries[0].id, 'second');
      assert.equal(entries[1].id, 'first');
    });
  });

  describe('deleteEntry', () => {
    it('removes the specified entry by id', () => {
      const a = makeEntry({ id: 'a' });
      const b = makeEntry({ id: 'b' });
      addEntry(a);
      addEntry(b);
      deleteEntry('a');
      const entries = getEntries();
      assert.equal(entries.length, 1);
      assert.equal(entries[0].id, 'b');
    });

    it('does nothing when id does not exist', () => {
      const entry = makeEntry({ id: 'x' });
      addEntry(entry);
      deleteEntry('nonexistent');
      assert.equal(getEntries().length, 1);
    });
  });

  describe('clearAll', () => {
    it('removes all entries', () => {
      addEntry(makeEntry());
      addEntry(makeEntry());
      clearAll();
      assert.deepEqual(getEntries(), []);
    });

    it('is idempotent when already empty', () => {
      clearAll();
      assert.deepEqual(getEntries(), []);
    });
  });

  describe('quota eviction', () => {
    it('drops oldest entries on QuotaExceededError and returns warning', () => {
      // Pre-populate two entries in storage so quota-eviction has something to drop
      const old1 = makeEntry({ id: 'old1' });
      const old2 = makeEntry({ id: 'old2' });
      _store.set(HISTORY_KEY, JSON.stringify([old2, old1]));

      // Make the NEXT setItem throw QuotaExceededError exactly once
      let callCount = 0;
      const original = mockLocalStorage.setItem.bind(mockLocalStorage);
      mockLocalStorage.setItem = function (key: string, value: string) {
        if (callCount === 0) {
          callCount++;
          const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
          throw err;
        }
        return original(key, value);
      };

      const newEntry = makeEntry({ id: 'new' });
      const result = addEntry(newEntry);

      // Restore original
      mockLocalStorage.setItem = original;

      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.warning, 'quota_exceeded');

      // oldest (old1) should have been dropped to make room
      const stored = getEntries();
      assert.ok(stored.some((e) => e.id === 'new'), 'new entry should be present');
      assert.ok(!stored.some((e) => e.id === 'old1'), 'oldest entry should have been evicted');
    });
  });
});
