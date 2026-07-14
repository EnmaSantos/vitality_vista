const getMealDbApiKey = (): string => {
  try {
    return Deno.env.get("THEMEALDB_API")?.trim() || "1";
  } catch (_error) {
    return "1";
  }
};

const THE_MEAL_DB_API_KEY = getMealDbApiKey();
const THE_MEAL_DB_API_VERSION = THE_MEAL_DB_API_KEY === "1" ? "v1" : "v2";
const THE_MEAL_DB_INGREDIENTS_URL =
  `https://www.themealdb.com/api/json/${THE_MEAL_DB_API_VERSION}/${
    encodeURIComponent(THE_MEAL_DB_API_KEY)
  }/list.php?i=list`;
const OPEN_FOOD_FACTS_PRODUCT_URL =
  "https://world.openfoodfacts.org/api/v2/product";
const REQUEST_TIMEOUT_MS = 3500;
const INGREDIENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const INGREDIENT_ERROR_CACHE_TTL_MS = 5 * 60 * 1000;
const USER_AGENT = "VitalityVista/1.0 (https://vitalityvista.enmasantos.dev)";

export interface FoodImageMetadata {
  imageUrl: string;
  imageSource: "FatSecret" | "Open Food Facts" | "TheMealDB";
  imageSourceUrl?: string;
}

interface ImageableFood {
  name: string;
  isGeneric: boolean;
  imageUrl?: string;
  imageSource?: FoodImageMetadata["imageSource"];
  imageSourceUrl?: string;
}

interface MealDbIngredient {
  strIngredient?: string | null;
  strThumb?: string | null;
}

interface MealDbIngredientResponse {
  meals?: MealDbIngredient[] | null;
}

interface OpenFoodFactsProduct {
  code?: string;
  image_front_small_url?: string | null;
  image_front_url?: string | null;
  image_url?: string | null;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct | null;
}

export interface IngredientImage {
  key: string;
  name: string;
  imageUrl: string;
}

let ingredientCache: IngredientImage[] | null = null;
let ingredientCacheExpiresAt = 0;
let ingredientRequest: Promise<IngredientImage[]> | null = null;

const singularizeToken = (token: string): string => {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.length > 4 && token.endsWith("oes")) {
    return token.slice(0, -2);
  }
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
};

const normalizeFoodName = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singularizeToken)
    .join(" ");

const safeImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString() : null;
  } catch (_error) {
    return null;
  }
};

const fetchJson = async (url: string): Promise<unknown> => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Image provider returned ${response.status}.`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchIngredientImages = async (): Promise<IngredientImage[]> => {
  const data = await fetchJson(
    THE_MEAL_DB_INGREDIENTS_URL,
  ) as MealDbIngredientResponse;
  const ingredients = Array.isArray(data.meals)
    ? data.meals as MealDbIngredient[]
    : [];

  return ingredients
    .map((ingredient) => {
      const name = ingredient.strIngredient?.trim() ?? "";
      const fullImageUrl = safeImageUrl(ingredient.strThumb);
      const imageUrl = fullImageUrl
        ? safeImageUrl(`${fullImageUrl}/small`)
        : null;
      const key = normalizeFoodName(name);
      return name && imageUrl && key ? { key, name, imageUrl } : null;
    })
    .filter((ingredient): ingredient is IngredientImage => Boolean(ingredient));
};

const getIngredientImages = (): Promise<IngredientImage[]> => {
  const now = Date.now();
  if (ingredientCache && ingredientCacheExpiresAt > now) {
    return Promise.resolve(ingredientCache);
  }
  if (ingredientRequest) return ingredientRequest;

  ingredientRequest = fetchIngredientImages()
    .then((images) => {
      ingredientCache = images;
      ingredientCacheExpiresAt = Date.now() + INGREDIENT_CACHE_TTL_MS;
      return images;
    })
    .catch((error) => {
      console.warn("TheMealDB food image fallback is unavailable:", error);
      ingredientCache = [];
      ingredientCacheExpiresAt = Date.now() + INGREDIENT_ERROR_CACHE_TTL_MS;
      return ingredientCache;
    })
    .finally(() => {
      ingredientRequest = null;
    });

  return ingredientRequest;
};

export const findIngredientImage = (
  foodName: string,
  ingredientImages: IngredientImage[],
): FoodImageMetadata | null => {
  const normalizedFoodName = normalizeFoodName(foodName);
  if (!normalizedFoodName) return null;

  // Exact normalized names only. A fuzzy match can show a convincing but
  // incorrect photo (for example, "Apple Banana Cake" as a plain apple).
  const match = ingredientImages.find((ingredient) =>
    normalizedFoodName === ingredient.key
  );

  if (!match) return null;

  return {
    imageUrl: match.imageUrl,
    imageSource: "TheMealDB",
    imageSourceUrl: "https://www.themealdb.com/",
  };
};

export const addIngredientImagesFromCatalog = <T extends ImageableFood>(
  foods: T[],
  ingredientImages: IngredientImage[],
): T[] =>
  foods.map((food) => {
    if (food.imageUrl || !food.isGeneric) return food;
    const image = findIngredientImage(food.name, ingredientImages);
    return image ? { ...food, ...image } : food;
  });

export const addIngredientImages = async <T extends ImageableFood>(
  foods: T[],
): Promise<T[]> => {
  if (!foods.some((food) => food.isGeneric && !food.imageUrl)) return foods;

  const ingredientImages = await getIngredientImages();
  if (ingredientImages.length === 0) return foods;
  return addIngredientImagesFromCatalog(foods, ingredientImages);
};

export const findBarcodeImage = async (
  barcode: string,
): Promise<FoodImageMetadata | null> => {
  const fields = [
    "code",
    "product_name",
    "brands",
    "image_front_small_url",
    "image_front_url",
    "image_url",
  ].join(",");
  const url = `${OPEN_FOOD_FACTS_PRODUCT_URL}/${
    encodeURIComponent(barcode)
  }.json?fields=${fields}`;

  try {
    const data = await fetchJson(url) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product) return null;

    const imageUrl = safeImageUrl(
      data.product.image_front_small_url ??
        data.product.image_front_url ??
        data.product.image_url,
    );
    if (!imageUrl) return null;

    const productCode = String(data.product.code ?? barcode).replace(/\D/g, "");
    return {
      imageUrl,
      imageSource: "Open Food Facts",
      imageSourceUrl: productCode
        ? `https://world.openfoodfacts.org/product/${productCode}`
        : "https://world.openfoodfacts.org/",
    };
  } catch (error) {
    console.warn(
      `Open Food Facts image lookup failed for barcode ${barcode}:`,
      error,
    );
    return null;
  }
};
