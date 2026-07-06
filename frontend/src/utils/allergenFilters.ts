export type AllergenKey =
  | 'milk'
  | 'egg'
  | 'peanut'
  | 'tree-nut'
  | 'soy'
  | 'wheat'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export interface AllergenOption {
  key: AllergenKey;
  label: string;
  terms: string[];
  ignoredPhrases?: string[];
}

export interface IngredientSafetyMatch {
  id: string;
  label: string;
  kind: 'allergen' | 'custom';
  matchedIngredients: string[];
}

export const ALLERGEN_OPTIONS: AllergenOption[] = [
  {
    key: 'milk',
    label: 'Milk',
    terms: [
      'milk',
      'buttermilk',
      'butter',
      'cheese',
      'cream',
      'yogurt',
      'yoghurt',
      'whey',
      'casein',
      'ghee',
      'curd',
      'custard',
      'parmesan',
      'cheddar',
      'mozzarella',
      'feta',
      'ricotta',
      'sour cream',
      'ice cream',
    ],
    ignoredPhrases: [
      'almond milk',
      'cashew milk',
      'coconut milk',
      'oat milk',
      'rice milk',
      'soy milk',
      'soya milk',
    ],
  },
  {
    key: 'egg',
    label: 'Egg',
    terms: ['egg', 'eggs', 'mayonnaise', 'mayo', 'meringue', 'albumen'],
  },
  {
    key: 'peanut',
    label: 'Peanut',
    terms: ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  },
  {
    key: 'tree-nut',
    label: 'Tree nuts',
    terms: [
      'almond',
      'almonds',
      'cashew',
      'cashews',
      'walnut',
      'walnuts',
      'pecan',
      'pecans',
      'hazelnut',
      'hazelnuts',
      'pistachio',
      'pistachios',
      'macadamia',
      'brazil nut',
      'brazil nuts',
      'pine nut',
      'pine nuts',
      'chestnut',
      'chestnuts',
      'marzipan',
    ],
  },
  {
    key: 'soy',
    label: 'Soy',
    terms: [
      'soy',
      'soya',
      'soybean',
      'soybeans',
      'tofu',
      'tempeh',
      'edamame',
      'miso',
      'tamari',
      'soy sauce',
    ],
  },
  {
    key: 'wheat',
    label: 'Wheat/gluten',
    terms: [
      'wheat',
      'gluten',
      'flour',
      'bread crumbs',
      'breadcrumbs',
      'panko',
      'pasta',
      'seitan',
      'couscous',
      'bulgur',
      'farro',
      'semolina',
      'spelt',
      'barley',
      'rye',
    ],
    ignoredPhrases: [
      'almond flour',
      'chickpea flour',
      'coconut flour',
      'corn flour',
      'gluten free flour',
      'gluten free bread',
      'gluten free pasta',
      'gluten-free flour',
      'gluten-free bread',
      'gluten-free pasta',
      'oat flour',
      'rice flour',
    ],
  },
  {
    key: 'fish',
    label: 'Fish',
    terms: [
      'anchovy',
      'anchovies',
      'bass',
      'cod',
      'fish',
      'fish sauce',
      'halibut',
      'haddock',
      'mackerel',
      'salmon',
      'sardine',
      'sardines',
      'tilapia',
      'trout',
      'tuna',
    ],
  },
  {
    key: 'shellfish',
    label: 'Shellfish',
    terms: [
      'clam',
      'clams',
      'crab',
      'crabs',
      'crayfish',
      'lobster',
      'mussel',
      'mussels',
      'oyster',
      'oysters',
      'prawn',
      'prawns',
      'scallop',
      'scallops',
      'shrimp',
      'shrimps',
    ],
  },
  {
    key: 'sesame',
    label: 'Sesame',
    terms: ['sesame', 'tahini', 'benne'],
  },
];

const ALLERGEN_OPTION_MAP = new Map(ALLERGEN_OPTIONS.map((option) => [option.key, option]));

export function parseCustomExclusions(value: string): string[] {
  return value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
}

export function normalizeIngredientText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function phraseMatches(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalizeIngredientText(phrase);
  if (!normalizedPhrase) return false;

  const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(^|\\s)${escapedPhrase}(\\s|$)`).test(normalizedText);
}

function ingredientMatchesOption(ingredient: string, option: AllergenOption): boolean {
  const normalizedIngredient = normalizeIngredientText(ingredient);
  if (!normalizedIngredient) return false;

  return option.terms.some((term) => {
    if (!phraseMatches(normalizedIngredient, term)) return false;

    const matchingIgnoredPhrases = option.ignoredPhrases?.filter((phrase) => phraseMatches(normalizedIngredient, phrase)) ?? [];
    if (matchingIgnoredPhrases.length === 0) return true;

    return matchingIgnoredPhrases.every((phrase) => !phraseMatches(normalizeIngredientText(phrase), term));
  });
}

export function findIngredientSafetyMatches(
  ingredients: string[],
  selectedAllergens: AllergenKey[],
  customExclusions: string[]
): IngredientSafetyMatch[] {
  const usableIngredients = ingredients.map((ingredient) => ingredient.trim()).filter(Boolean);
  const matches: IngredientSafetyMatch[] = [];

  selectedAllergens.forEach((allergenKey) => {
    const option = ALLERGEN_OPTION_MAP.get(allergenKey);
    if (!option) return;

    const matchedIngredients = usableIngredients.filter((ingredient) => ingredientMatchesOption(ingredient, option));
    if (matchedIngredients.length > 0) {
      matches.push({
        id: option.key,
        label: option.label,
        kind: 'allergen',
        matchedIngredients: Array.from(new Set(matchedIngredients)),
      });
    }
  });

  customExclusions.forEach((rawTerm) => {
    const term = rawTerm.trim();
    if (!term) return;

    const matchedIngredients = usableIngredients.filter((ingredient) => phraseMatches(normalizeIngredientText(ingredient), term));
    if (matchedIngredients.length > 0) {
      matches.push({
        id: `custom:${normalizeIngredientText(term)}`,
        label: term,
        kind: 'custom',
        matchedIngredients: Array.from(new Set(matchedIngredients)),
      });
    }
  });

  return matches;
}

export function getMatchedIngredientLabels(
  ingredient: string,
  matches: IngredientSafetyMatch[]
): string[] {
  const normalizedIngredient = normalizeIngredientText(ingredient);
  if (!normalizedIngredient) return [];

  return matches
    .filter((match) => match.matchedIngredients.some((matchedIngredient) => (
      normalizeIngredientText(matchedIngredient) === normalizedIngredient
    )))
    .map((match) => match.label);
}
