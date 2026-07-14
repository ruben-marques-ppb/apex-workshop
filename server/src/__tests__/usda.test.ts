import { strict as assert } from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { _clearUsdaCacheForTests, _setUsdaFixtureForTests, lookupCalories } from '../usda.js';

describe('lookupCalories', () => {
  afterEach(() => _clearUsdaCacheForTests());

  it('finds a close fuzzy match', () => {
    _setUsdaFixtureForTests([
      { description: 'Fast foods, cheeseburger; single, regular patty, plain', kcalPer100g: 300 },
      { description: 'Fast foods, potato, french fried in vegetable oil', kcalPer100g: 312 },
    ]);
    const hit = lookupCalories('cheeseburger');
    assert.ok(hit, 'expected a match');
    assert.match(hit!.match.description, /cheeseburger/i);
    assert.equal(hit!.match.kcalPer100g, 300);
  });

  it('returns null when nothing matches', () => {
    _setUsdaFixtureForTests([
      { description: 'Fast foods, cheeseburger; single, regular patty, plain', kcalPer100g: 300 },
    ]);
    const hit = lookupCalories('xyzzynotafood');
    assert.equal(hit, null);
  });
});
