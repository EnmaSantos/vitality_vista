// backend/routes/recipes.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps
// Import the handler functions we created in recipeController.ts
import {
  searchRecipesHandler,
  getRecipeByIdHandler, 
  getRecipesByCategoryHandler,
  estimateRecipeCaloriesHandler,
} from "../controllers/recipeController.ts";

// ---> ADDED: Import authentication middleware to protect the new route
import { authMiddleware } from "../middleware/authMiddleware.ts";

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



recipeRouter.get("/category/:categoryName", getRecipesByCategoryHandler);// --- TODO: Add routes for other recipe actions ---
// e.g., GET /api/recipes/categories -> listCategoriesHandler
// e.g., GET /api/recipes/filter/category/:categoryName -> filterRecipesByCategoryHandler
// e.g., POST /api/users/me/favorite-recipes (Protected Route) -> addFavoriteRecipeHandler (would need authMiddleware)


// ---> ADDED: Route definition for calorie estimation <---
// GET /api/recipes/:id/estimate-calories (Protected)
// Estimates the total calories for a given recipe ID.
recipeRouter.get(
  "/:id/estimate-calories",
  authMiddleware, // Protect the route
  estimateRecipeCaloriesHandler // The new handler function
);


// Export the configured router
export default recipeRouter;