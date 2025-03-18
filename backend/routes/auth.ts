// routes/auth.ts
import { Router } from "../deps.ts";
import { register, login, getCurrentUser } from "../controllers/authController.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts";

const router = new Router({ prefix: "/api/auth" });

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authMiddleware, getCurrentUser);

export default router;