// FILE: routes/authRoutes.ts

import { Router } from "../deps.ts";
import { register, login, forgotPassword } from "../controllers/authController.ts";

const authRouter = new Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);

export default authRouter;