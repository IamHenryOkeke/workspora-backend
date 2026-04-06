import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { UserService } from "./user.service";
import { User } from "../../generated/prisma/client";

export class UserController {
  constructor(private userService: UserService) {}

  getCurrentUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;

      const result = await this.userService.getCurrentUser(user);

      res.status(200).json(result);
    },
  );
}
