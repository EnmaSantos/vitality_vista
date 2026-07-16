const MINOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

const ACRONYMS: Record<string, string> = {
  ez: 'EZ',
  hiit: 'HIIT',
  ii: 'II',
  iii: 'III',
  iv: 'IV',
  jm: 'JM',
  pov: 'POV',
  sldl: 'SLDL',
  trx: 'TRX',
};

const SPELLING_CORRECTIONS: Record<string, string> = {
  alternate: 'alternating',
  curtsey: 'curtsy',
  sitted: 'seated',
  touchers: 'touches',
};

const WORD_PATTERN = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

/**
 * Makes dataset exercise labels consistent without changing their identifiers.
 * The formatter is intentionally conservative because many exercise names are
 * established technical terms rather than ordinary prose.
 */
export function formatExerciseName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(?:Â|в)?°/g, '°')
    .replace(/\b(one|single|double|two)\s+(arm|leg)\b/gi, '$1-$2')
    .replace(/\bv\.?\s*(\d+)\b/gi, 'V$1');

  if (!cleaned) return '';

  const wordCount = cleaned.match(WORD_PATTERN)?.length ?? 0;
  let wordIndex = 0;

  return cleaned.replace(WORD_PATTERN, (word, offset: number) => {
    const lowercaseWord = word.toLowerCase();
    const correctedWord = SPELLING_CORRECTIONS[lowercaseWord] ?? lowercaseWord;
    const acronym = ACRONYMS[correctedWord];
    const previousCharacter = cleaned.slice(0, offset).trimEnd().slice(-1);
    const startsNewSegment = previousCharacter === '(' || previousCharacter === '-' || previousCharacter === '/';
    const isMinorWord =
      MINOR_WORDS.has(correctedWord) &&
      wordIndex > 0 &&
      wordIndex < wordCount - 1 &&
      !startsNewSegment;

    wordIndex += 1;

    if (acronym) return acronym;
    if (isMinorWord) return correctedWord;

    return correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
  });
}
