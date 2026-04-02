import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { AuthSchema } from "../modules/auth/auth.schema";
import { AuthRepository } from "../modules/auth/auth.repository";
import { AuthService } from "../modules/auth/auth.service";
import { AuthController } from "../modules/auth/auth.controller";

const authRouter = Router();

const authRepo = new AuthRepository();
const authService = new AuthService(authRepo);
const authController = new AuthController(authService);

authRouter.post(
  "/register",
  validate({
    body: AuthSchema.createUserSchema,
  }),
  authController.register,
);

// authRouter.get(
//   "/verify-account",
//   validate(),
// );
// authRouter.post(
//   "/request-verification-link",
//   validate({ body: sendVerificationLinkSchema }),
// );

// authRouter.post(
//   "/login",
//   validate({ body: loginUserSchema }),
// );
// authRouter.post(
//   "/request-password-reset",
//   validate({ body: sendVerificationLinkSchema }),
// );
// authRouter.post(
//   "/reset-password",
//   validate({ body: resetPassswordSchema }),
// );

// authRouter.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] }),
// );
// authRouter.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false }),
//   (req, res) => {
//     const user = req.user as User;

//     const token = signJWT(user, 60 * 15);

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user,
//     });
//   },
// );

export default authRouter;
