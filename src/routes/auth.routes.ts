import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { AuthSchema } from "../modules/auth/auth.schema";
import { AuthRepository } from "../modules/auth/auth.repository";
import { AuthService } from "../modules/auth/auth.service";
import { AuthController } from "../modules/auth/auth.controller";
import { rateLimiter } from "../middleware/rate-limiter.middleware";
import { signJWT } from "../utils/jwt";
import { User } from "../generated/prisma/client";
import passport from "passport";
import { getEnv } from "../config/env";
import { isAuthenticated } from "../middleware/auth.middleware";

const authRouter = Router();

const authRepo = new AuthRepository();
const authService = new AuthService(authRepo);
const authController = new AuthController(authService);

authRouter.post(
  "/register",
  rateLimiter(5),
  validate({
    body: AuthSchema.createUserSchema,
  }),
  authController.register,
);

authRouter.get(
  "/verify-account",
  validate({
    query: AuthSchema.verifyAccountQuerySchema,
  }),
  authController.verifyAccount,
);

authRouter.post(
  "/login",
  rateLimiter(5),
  validate({ body: AuthSchema.loginUserSchema }),
  authController.login,
);

authRouter.post("/logout", isAuthenticated, authController.logout);

authRouter.post("/refresh", authController.refreshAccessToken);

authRouter.post(
  "/request-verification-link",
  validate({ body: AuthSchema.sendVerificationLinkSchema }),
  authController.requestVerificationLink,
);

authRouter.post(
  "/request-password-reset",
  validate({ body: AuthSchema.sendVerificationLinkSchema }),
  authController.requestPasswordResetLink,
);

authRouter.post(
  "/reset-password",
  validate({ body: AuthSchema.resetPassswordSchema }),
  authController.resetPassword,
);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as User;
    const token = signJWT(user, "access", 60 * 15);

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.fullName,
      avatar: user.avatar,
    };

    const params = new URLSearchParams({
      token,
      user: JSON.stringify(userPayload),
    });

    const redirectUrl = `${getEnv("FRONTEND_URL")}/auth/google/callback?${params.toString()}`;
    res.redirect(redirectUrl);
  },
);

export default authRouter;
