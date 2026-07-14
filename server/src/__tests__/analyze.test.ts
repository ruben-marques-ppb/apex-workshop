import { strict as assert } from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { buildAnalyzeResponse } from '../analyze.js';
import { _clearUsdaCacheForTests, _setUsdaFixtureForTests } from '../usda.js';

describe('buildAnalyzeResponse', () => {
  afterEach(() => _clearUsdaCacheForTests());

  it('computes calories per item and grand total', () => {
    _setUsdaFixtureForTests([
      { description: 'Fast foods, cheeseburger', kcalPer100g: 300 },
      { description: 'Fast foods, french fries', kcalPer100g: 312 },
    ]);
    const res = buildAnalyzeResponse([
      { food: 'cheeseburger', estimated_grams: 180, confidence: 0.9 },
      { food: 'french fries', estimated_grams: 100, confidence: 0.9 },
    ]);
    assert.equal(res.items.length, 2);
    assert.equal(res.items[0]!.kcal, 540); // 300 * 180 / 100
    assert.equal(res.items[1]!.kcal, 312); // 312 * 100 / 100
    assert.equal(res.totalKcal, 852);
    assert.deepEqual(res.warnings, []);
  });

  it('excludes unmatched foods from total and adds a warning', () => {
    _setUsdaFixtureForTests([{ description: 'Fast foods, cheeseburger', kcalPer100g: 300 }]);
    const res = buildAnalyzeResponse([
      { food: 'cheeseburger', estimated_grams: 100, confidence: 0.9 },
      { food: 'xyzzynotafood', estimated_grams: 50, confidence: 0.5 },
    ]);
    assert.equal(res.items.length, 2);
    assert.equal(res.items[1]!.kcal, null);
    assert.equal(res.totalKcal, 300);
    assert.equal(res.warnings.length, 1);
  });
});
