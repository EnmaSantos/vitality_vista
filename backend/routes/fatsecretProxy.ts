import { Router } from "../deps.ts";
import {
  handleFoodSearch,
  handleGetFoodDetails,
  handleFoodAutocomplete,
  handleFoodSearchV5,
  handleFindFoodByBarcode,
  handleFoodFeedback,
  handleFoodBrands,
  handleFoodCategories,
  handleFoodSubCategories,
} from "../controllers/foodController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const fatsecretProxyRouter = new Router();

fatsecretProxyRouter
  .post("/feedback", authMiddleware, handleFoodFeedback)
  .get("/brands", authMiddleware, handleFoodBrands)
  .get("/categories", authMiddleware, handleFoodCategories)
  .get("/sub-categories", authMiddleware, handleFoodSubCategories)
  .get("/barcode/:barcode", authMiddleware, handleFindFoodByBarcode)
  .get("/search-v5", authMiddleware, handleFoodSearchV5)
  .get("/search", authMiddleware, handleFoodSearch)
  .get("/autocomplete", authMiddleware, handleFoodAutocomplete)
  .get("/:foodId", authMiddleware, handleGetFoodDetails);

export default fatsecretProxyRouter;
