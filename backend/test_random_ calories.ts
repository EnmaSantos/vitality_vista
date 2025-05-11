interface MealDBMeal {
    idMeal: string;
    strMeal: string;
    // Add other fields if you need them, but these are primary for this script
    [key: string]: any; // Allow other properties
  }
  
  interface CalorieEstimationResult {
    recipeId: string;
    recipeName: string;
    success?: boolean;
    data?: any; // Structure of your /estimate-calories response data
    error?: string;
    details?: any; // For error details
  }
  
  /**
   * Fetches a specified number of random meal data from TheMealDB.
   * @param count The number of random recipes to fetch.
   */
  async function getRandomRecipes(count: number = 10): Promise<MealDBMeal[]> {
    const recipes: MealDBMeal[] = [];
    console.log(`Fetching ${count} random recipes from TheMealDB...`);
    for (let i = 0; i < count; i++) {
      try {
        const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
        if (!response.ok) {
          console.error(`Error fetching random recipe ${i + 1}/${count}: ${response.status} ${response.statusText}`);
          continue; // Skip to next attempt
        }
        const data = await response.json();
        if (data.meals && data.meals.length > 0 && data.meals[0].idMeal) {
          recipes.push(data.meals[0] as MealDBMeal);
          console.log(`  Fetched recipe ${i + 1}/${count}: ${data.meals[0].strMeal}`);
        } else {
          console.warn(`  Random recipe ${i + 1}/${count} fetch returned no meal data.`);
        }
      } catch (error) {
        console.error(`  Network error fetching random recipe ${i + 1}/${count}:`, error.message);
      }
      // Add a small delay to be polite to the API
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    console.log(`Finished fetching ${recipes.length} recipes.`);
    return recipes;
  }
  
  /**
   * Calls your local backend to get calorie estimation for a given recipe ID.
   * @param recipeId The ID of the recipe.
   * @param recipeName The name of the recipe (for logging).
   * @param localApiPort The port your Deno backend is running on.
   */
  async function getCalorieEstimation(
    recipeId: string,
    recipeName: string,
    localApiPort: number = 8000
  ): Promise<CalorieEstimationResult> {
    const apiUrl = `http://localhost:${localApiPort}/api/recipes/${recipeId}/estimate-calories`;
    console.log(`  Requesting calorie estimation for "${recipeName}" (ID: ${recipeId}) from ${apiUrl}`);
    try {
      // The request to your endpoint is a POST request
      const response = await fetch(apiUrl, { method: "POST" });
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error(`  Error from local API for "${recipeName}": ${response.status} ${response.statusText}`);
        return {
          recipeId,
          recipeName,
          error: `Local API Error: ${response.status} ${response.statusText}`,
          details: responseData,
        };
      }
      return { recipeId, recipeName, ...responseData };
    } catch (error) {
      console.error(`  Network or parsing error calling local API for "${recipeName}":`, error.message);
      return { recipeId, recipeName, error: `Local API call failed: ${error.message}` };
    }
  }
  
  /**
   * Main script function.
   */
  async function main() {
    const numberOfRecipesToTest = 10;
    // Ensure your Deno backend server is running on this port
    const backendPort = 8000; 
  
    console.log("Starting script to test calorie calculations for random recipes...");
    console.log(`Ensure your Deno backend is running on http://localhost:${backendPort}`);
  
    const randomMeals = await getRandomRecipes(numberOfRecipesToTest);
  
    if (randomMeals.length === 0) {
      console.log("No random recipes were fetched. Exiting script.");
      return;
    }
  
    console.log(`\nProcessing ${randomMeals.length} recipes for calorie estimation:`);
    const allResults: CalorieEstimationResult[] = [];
  
    for (const meal of randomMeals) {
      console.log(`\n--- Testing: ${meal.strMeal} (ID: ${meal.idMeal}) ---`);
      const estimationResult = await getCalorieEstimation(meal.idMeal, meal.strMeal, backendPort);
      allResults.push(estimationResult);
      
      // Log the detailed result immediately
      console.log("  Estimation Details:");
      console.log(JSON.stringify(estimationResult, null, 2)); // Pretty print JSON
      
      // Small delay before the next recipe
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  
    console.log("\n\n--- All Test Results Collected ---");
    // You can choose to log all results again or just indicate completion
    // For detailed review, you might want to save `allResults` to a file:
    try {
      const outputFilename = "random_calorie_test_results.json";
      await Deno.writeTextFile(outputFilename, JSON.stringify(allResults, null, 2));
      console.log(`All results have been saved to: ${outputFilename}`);
    } catch (e) {
      console.error("Failed to write results to file:", e.message);
    }
  
    console.log("\nScript finished.");
  }
  
  // Run the main function
  main().catch(err => {
    console.error("\nUnhandled error during script execution:", err);
  });