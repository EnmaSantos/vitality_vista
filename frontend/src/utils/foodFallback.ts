const FILLER_WORDS = new Set([
  'a',
  'an',
  'and',
  'ate',
  'for',
  'had',
  'have',
  'i',
  'meal',
  'my',
  'of',
  'the',
  'to',
  'with',
]);

export function buildMealTextFallbackQuery(input: string): string {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !FILLER_WORDS.has(word));

  const uniqueWords = Array.from(new Set(words)).slice(0, 6);
  return uniqueWords.join(' ') || input.trim().slice(0, 80);
}
