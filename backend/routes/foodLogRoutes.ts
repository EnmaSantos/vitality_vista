import { Router } from "../deps.ts";
import {
  createFoodLogEntryHandler,
  getFoodLogEntriesHandler,
  deleteFoodLogEntryHandler,
} from "../controllers/foodController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const foodLogRouter = new Router();

foodLogRouter
  .post("/", authMiddleware, createFoodLogEntryHandler)
  .get("/", authMiddleware, getFoodLogEntriesHandler)
  .delete("/:logEntryId", authMiddleware, deleteFoodLogEntryHandler);
// Add GET, PUT, DELETE for food logs here later

export default foodLogRouter; 