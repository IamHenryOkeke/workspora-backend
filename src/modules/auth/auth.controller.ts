import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { User } from "../../generated/prisma/client";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.authService.register(req.body);

      res.status(201).json(result);
    },
  );

  verifyAccount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.authService.verifyAccount(req.validatedQuery);

      res.status(200).json(result);
    },
  );

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken, ...payload } = await this.authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(payload);
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;

    const result = await this.authService.logout(user);

    res.status(200).json(result);
  });

  refreshAccessToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const refreshToken = req.cookies.refreshToken;

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.status(200).json(result);
    },
  );

  requestVerificationLink = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email } = req.body;

      const result = await this.authService.sendVerificationEmail(
        email as string,
      );

      res.status(200).json(result);
    },
  );

  requestPasswordResetLink = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email } = req.body;

      const result = await this.authService.sendPasswordResetLink(email);

      res.status(200).json(result);
    },
  );

  resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await this.authService.resetPassword(req.body);

      res.status(200).json(result);
    },
  );
}
