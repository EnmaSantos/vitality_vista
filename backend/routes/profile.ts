// backend/routes/profile.ts
import { Router } from "../deps.ts";
import {
  getUserProfileHandler,
  updateUserProfileHandler,
} from "../controllers/profileController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const profileRouter = new Router({
  prefix: "/users/me/profile", // Base path for these profile routes
});

// GET /api/users/me/profile - Requires authentication
profileRouter.get("/", authMiddleware, getUserProfileHandler);

// PUT /api/users/me/profile - Requires authentication
profileRouter.put("/", authMiddleware, updateUserProfileHandler);

export default profileRouter; 