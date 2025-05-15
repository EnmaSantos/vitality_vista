// routes/auth.ts
import { Router } from "../deps.ts";
import { register, login, getCurrentUser, logoutUser } from "../controllers/authController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router({ prefix: "/auth" });

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logoutUser);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);

export default router;