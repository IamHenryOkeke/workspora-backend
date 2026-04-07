import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { UserService } from "./user.service";
import { User } from "../../generated/prisma/client";

export class UserController {
  constructor(private userService: UserService) {}

  getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;

    const data = await this.userService.getUser(user);

    const result = {
      message: "User profile fetched successfully",
      data: {
        user: data,
      },
    };

    res.status(200).json(result);
  });

  updateUserProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { user, body } = req;

      const data = await this.userService.updateUserProfile(user as User, body);

      const result = {
        message: "User profile updated successfully",
        data: {
          user: data,
        },
      };

      res.status(200).json(result);
    },
  );

  updateUserPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { user, body } = req;

      await this.userService.updateUserPassword(user as User, body);

      const result = {
        message: "User password updated successfully",
      };

      res.status(200).json(result);
    },
  );

  getInvitations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { user, validatedQuery } = req;

      const data = await this.userService.getInvitations(
        user as User,
        validatedQuery as { searchTerm: string; page: number; limit: number },
      );

      res.status(200).json({
        message: "Invitations fetched successfully",
        data,
      });
    },
  );
}
