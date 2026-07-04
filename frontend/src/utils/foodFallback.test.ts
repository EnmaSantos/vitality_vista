import { describe, expect, it } from 'vitest';
import { buildMealTextFallbackQuery } from './foodFallback';

describe('buildMealTextFallbackQuery', () => {
  it('removes filler words and keeps food terms', () => {
    expect(buildMealTextFallbackQuery('For breakfast I ate a toast with ham and cheese')).toBe('breakfast toast ham cheese');
  });

  it('falls back to trimmed input when no useful tokens remain', () => {
    expect(buildMealTextFallbackQuery('I had a')).toBe('I had a');
  });
});
