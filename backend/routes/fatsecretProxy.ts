import { Router } from "../deps.ts";
import {
  handleFoodSearch,
  handleGetFoodDetails,
  handleFoodAutocomplete,
} from "../controllers/foodController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const fatsecretProxyRouter = new Router();

fatsecretProxyRouter
  .get("/search", authMiddleware, handleFoodSearch)
  .get("/autocomplete", authMiddleware, handleFoodAutocomplete)
  .get("/:foodId", authMiddleware, handleGetFoodDetails);

export default fatsecretProxyRouter;
