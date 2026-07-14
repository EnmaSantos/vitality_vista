import {
  addIngredientImagesFromCatalog,
  IngredientImage,
} from "./foodImageService.ts";

const ingredientImages: IngredientImage[] = [
  {
    key: "apple",
    name: "Apples",
    imageUrl: "https://www.themealdb.com/images/ingredients/apples.png/small",
  },
  {
    key: "chicken",
    name: "Chicken",
    imageUrl: "https://www.themealdb.com/images/ingredients/chicken.png/small",
  },
];

interface TestFood {
  name: string;
  isGeneric: boolean;
  imageUrl?: string;
  imageSource?: "FatSecret" | "Open Food Facts" | "TheMealDB";
}

const assertEquals = (actual: unknown, expected: unknown) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, received ${actualJson}`);
  }
};

Deno.test("adds an exact generic ingredient image", () => {
  const [food] = addIngredientImagesFromCatalog<TestFood>([
    { name: "Apples", isGeneric: true },
  ], ingredientImages);

  assertEquals(food.imageUrl, ingredientImages[0].imageUrl);
  assertEquals(food.imageSource, "TheMealDB");
});

Deno.test("does not use an ingredient image for a branded food", () => {
  const [food] = addIngredientImagesFromCatalog<TestFood>([
    { name: "Chicken", isGeneric: false },
  ], ingredientImages);

  assertEquals(food.imageUrl, undefined);
});

Deno.test("does not overwrite an official food image", () => {
  const [food] = addIngredientImagesFromCatalog<TestFood>([
    {
      name: "Chicken",
      isGeneric: true,
      imageUrl: "https://example.com/official-chicken.jpg",
      imageSource: "FatSecret" as const,
    },
  ], ingredientImages);

  assertEquals(food.imageUrl, "https://example.com/official-chicken.jpg");
  assertEquals(food.imageSource, "FatSecret");
});

Deno.test("does not use partial or fuzzy ingredient matches", () => {
  const foods = addIngredientImagesFromCatalog<TestFood>([
    { name: "Grilled Chicken", isGeneric: true },
    { name: "Apple Banana Cake", isGeneric: true },
  ], ingredientImages);

  assertEquals(foods.map((food) => food.imageUrl), [undefined, undefined]);
});
