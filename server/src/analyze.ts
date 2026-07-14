import type { AnalyzeItem, AnalyzeResponse, VlmItem } from './types.js';
import { lookupCalories } from './usda.js';

/**
 * Turn raw VLM items into the API response by looking up calories per item.
 */
export function buildAnalyzeResponse(vlmItems: VlmItem[]): AnalyzeResponse {
  const items: AnalyzeItem[] = [];
  const warnings: string[] = [];
  let totalKcal = 0;

  for (const v of vlmItems) {
    const hit = lookupCalories(v.food);
    if (!hit) {
      items.push({
        food: v.food,
        matchedUsda: null,
        grams: v.estimated_grams,
        kcal: null,
        confidence: v.confidence,
      });
      warnings.push(`No USDA match for "${v.food}" — excluded from total.`);
      continue;
    }
    const kcal = Math.round((hit.match.kcalPer100g * v.estimated_grams) / 100);
    items.push({
      food: v.food,
      matchedUsda: hit.match.description,
      grams: v.estimated_grams,
      kcal,
      confidence: v.confidence,
    });
    totalKcal += kcal;
  }

  return { items, totalKcal, warnings };
}
