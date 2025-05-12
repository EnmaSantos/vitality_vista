import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"; // Adjust version as needed
import {
    handleSearchFatSecretRecipes,
    handleGetFatSecretRecipeById,
    handleGetFatSecretRecipeTypes
} from "../controllers/recipeController.ts";

// Create a new router instance
const recipesRouter = new Router();

// Define the routes for FatSecret recipe interactions
// The base path (e.g., /api/fatsecret/recipes) will be defined where this router is used.
recipesRouter
    .get("/search", handleSearchFatSecretRecipes) // GET /api/fatsecret/recipes/search?search_expression=...
    .get("/types", handleGetFatSecretRecipeTypes)  // GET /api/fatsecret/recipes/types
    .get("/:id", handleGetFatSecretRecipeById);     // GET /api/fatsecret/recipes/:id

// Export the configured router
export default recipesRouter;
