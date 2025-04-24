// backend/routes/food.ts

import { Router } from "../deps.ts"; // Import Router from Oak/deps [cite: vitality_vista.zip/backend/deps.ts]
// Import the handler functions from foodController.ts
import {
  searchFoodsHandler,
  getFoodDetailsHandler,
  // Import other handlers here later if needed
} from "../controllers/foodController.ts";

// Import authentication middleware if needed for protected routes later
// import { authMiddleware } from "../middleware/authMiddleware.ts";

// Create a new router instance with a prefix for food-related routes
const foodRouter = new Router({
  prefix: "/api/food",
});

// --- Define Food Data Routes ---

// GET /api/food/search?query=...&page=...&pageSize=...
// Maps to the searchFoodsHandler function
foodRouter.get("/search", searchFoodsHandler);

// GET /api/food/:fdcId (e.g., /api/food/169967)
// Maps to the getFoodDetailsHandler function. ':fdcId' creates a route parameter.
foodRouter.get("/:fdcId", getFoodDetailsHandler);


// --- TODO: Add routes for other potential food actions ---
// e.g., POST /api/log (Food logging would likely be a separate feature/route)


// Export the configured router
export default foodRouter;