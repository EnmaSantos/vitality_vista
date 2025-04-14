// backend/routes/recipes.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps [cite: vitality_vista.zip/backend/deps.ts]
// Import the handler functions we created in recipeController.ts
import {
  searchRecipesHandler,
  getRecipeByIdHandler,
  // Import other handlers here later if needed (e.g., listCategoriesHandler)
} from "../controllers/recipeController.ts";

// Import authentication middleware if needed for protected routes later
// import { authMiddleware } from "../middleware/authMiddleware.ts";

// Create a new router instance with a prefix for recipe-related routes
const recipeRouter = new Router({
  prefix: "/api/recipes",
});

// --- Define Recipe Routes ---

// GET /api/recipes/search?name=...
// Maps to the searchRecipesHandler function
recipeRouter.get("/search", searchRecipesHandler);

// GET /api/recipes/:id (e.g., /api/recipes/52771)
// Maps to the getRecipeByIdHandler function. ':id' creates a route parameter.
recipeRouter.get("/:id", getRecipeByIdHandler);


// --- TODO: Add routes for other recipe actions ---
// e.g., GET /api/recipes/categories -> listCategoriesHandler
// e.g., GET /api/recipes/filter/category/:categoryName -> filterRecipesByCategoryHandler
// e.g., POST /api/users/me/favorite-recipes (Protected Route) -> addFavoriteRecipeHandler (would need authMiddleware)


// Export the configured router
export default recipeRouter;