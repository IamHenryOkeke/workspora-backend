import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password } = req.body;

      const user = await this.authService.signUp(email, password);

      res.status(201).json({
        message:
          "Registration successful. Please check your email for a verification link",
        user,
      });
    },
  );

  // async login(req: Request, res: Response) {
  //   try {
  //     const { email, password } = req.body;

  //     const user = await this.authService.login(email, password);

  //     res.json(user);
  //   } catch (error: any) {
  //     res.status(400).json({ message: error.message });
  //   }
  // }
}
