import { AppError } from "../../error/error-handler";
import { User } from "../../generated/prisma/client";
import { UserRepository } from "./user.repository";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getCurrentUser(user: User) {
    const currentUser = await this.userRepo.getUserById(user.id);

    if (!currentUser) throw new AppError("Account no longer exists.", 404);

    return {
      message: "Current user retrieved successfully",
      data: {
        user: currentUser,
      },
    };
  }
}
