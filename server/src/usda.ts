import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fuse from 'fuse.js';
import type { UsdaFood } from './types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_PATH = join(__dirname, '..', '..', 'data', 'sr_legacy.json');

// SR Legacy nutrient number for Energy (kcal). Reference:
// https://fdc.nal.usda.gov/fdc-app.html#/nutrients
const ENERGY_KCAL_NUTRIENT_NUMBERS = new Set(['208', '1008']);

let cache: { foods: UsdaFood[]; fuse: Fuse<UsdaFood> } | null = null;

export function loadUsda(): { foods: UsdaFood[]; fuse: Fuse<UsdaFood> } {
  if (cache) return cache;

  if (!existsSync(DATA_PATH)) {
    throw new Error(
      `USDA SR Legacy JSON not found at ${DATA_PATH}. Run \`npm run data:download\` from the repo root.`,
    );
  }

  const raw = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as {
    SRLegacyFoods?: Array<{
      description: string;
      foodNutrients: Array<{
        nutrient?: { number?: string };
        amount?: number;
      }>;
    }>;
  };

  const items = raw.SRLegacyFoods ?? [];
  const foods: UsdaFood[] = [];
  for (const f of items) {
    const kcalRow = f.foodNutrients.find(
      (n) => n.nutrient?.number && ENERGY_KCAL_NUTRIENT_NUMBERS.has(n.nutrient.number),
    );
    if (kcalRow?.amount == null) continue;
    foods.push({ description: f.description, kcalPer100g: kcalRow.amount });
  }

  const fuse = new Fuse(foods, {
    keys: ['description'],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
  });

  cache = { foods, fuse };
  return cache;
}

export function lookupCalories(name: string): { match: UsdaFood; score: number } | null {
  const { fuse } = loadUsda();
  const [top] = fuse.search(name, { limit: 1 });
  if (!top) return null;
  return { match: top.item, score: top.score ?? 1 };
}

/** For tests: inject a fixture instead of loading the real JSON. */
export function _setUsdaFixtureForTests(foods: UsdaFood[]): void {
  const fuse = new Fuse(foods, {
    keys: ['description'],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
  });
  cache = { foods, fuse };
}

export function _clearUsdaCacheForTests(): void {
  cache = null;
}
