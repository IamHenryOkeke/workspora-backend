import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await this.authService.register(req.body);

      res.status(201).json({
        message:
          "Registration successful. Please check your email for a verification link",
        user,
      });
    },
  );

  verifyAccount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.query;

      const result = await this.authService.verifyAccount(token as string);

      res.status(200).json(result);
    },
  );
}
