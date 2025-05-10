// backend/routes/recipes.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps
import type { AppState } from "../controllers/recipeController.ts"; // Import AppState
// Import the handler functions we created in recipeController.ts
import {
  searchRecipesHandler,
  getRecipeByIdHandler, 
  getRecipesByCategoryHandler,
  estimateRecipeCaloriesHandler,
  getFeaturedRecipesHandler,
} from "../controllers/recipeController.ts";

// ---> ADDED: Import authentication middleware to protect the new route
import { authMiddleware } from "../middleware/authMiddleware.ts";

// Create a new router instance with a prefix and AppState type
const recipeRouter = new Router<AppState>({ // Specify AppState here
  prefix: "/api/recipes",
});

// --- Define Recipe Routes ---

// GET /api/recipes/search?name=...
// Maps to the searchRecipesHandler function
recipeRouter.get("/search", searchRecipesHandler);

// GET /api/recipes/featured
recipeRouter.get("/featured", getFeaturedRecipesHandler);

// GET /api/recipes/:id
// The path here should be relative to the prefix, so just "/:id"
recipeRouter.get<"/:id">("/:id", getRecipeByIdHandler);

// POST /api/recipes/:id/estimate-calories (Protected)
// The path here should be relative to the prefix, so just "/:id/estimate-calories"
recipeRouter.post<"/:id/estimate-calories">("/:id/estimate-calories", authMiddleware, estimateRecipeCaloriesHandler);

// GET /api/recipes/category/:categoryName
// The path here should be relative to the prefix, so just "/category/:categoryName"
recipeRouter.get<"/category/:categoryName">("/category/:categoryName", getRecipesByCategoryHandler);

// Export the configured router
export default recipeRouter;