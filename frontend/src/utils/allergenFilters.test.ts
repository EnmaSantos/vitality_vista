import { describe, expect, it } from 'vitest';
import {
  findIngredientSafetyMatches,
  getMatchedIngredientLabels,
  parseCustomExclusions,
} from './allergenFilters';

describe('allergenFilters', () => {
  it('matches common dairy ingredients without flagging plant milk', () => {
    const matches = findIngredientSafetyMatches(
      ['sharp cheddar cheese', 'coconut milk', 'rolled oats'],
      ['milk'],
      []
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].matchedIngredients).toEqual(['sharp cheddar cheese']);
  });

  it('matches wheat ingredients without flagging common gluten-free flour names', () => {
    const matches = findIngredientSafetyMatches(
      ['wheat flour', 'almond flour', 'gluten-free pasta'],
      ['wheat'],
      []
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].matchedIngredients).toEqual(['wheat flour']);
  });

  it('supports custom comma-separated exclusions', () => {
    const customExclusions = parseCustomExclusions('cilantro, mushrooms,  pork ');
    const matches = findIngredientSafetyMatches(
      ['fresh cilantro', 'button mushrooms', 'black beans'],
      [],
      customExclusions
    );

    expect(customExclusions).toEqual(['cilantro', 'mushrooms', 'pork']);
    expect(matches.map((match) => match.label)).toEqual(['cilantro', 'mushrooms']);
  });

  it('returns labels for highlighted detail ingredients', () => {
    const matches = findIngredientSafetyMatches(
      ['1 large egg', '2 tbsp sesame seeds'],
      ['egg', 'sesame'],
      []
    );

    expect(getMatchedIngredientLabels('1 large egg', matches)).toEqual(['Egg']);
    expect(getMatchedIngredientLabels('2 tbsp sesame seeds', matches)).toEqual(['Sesame']);
  });
});
