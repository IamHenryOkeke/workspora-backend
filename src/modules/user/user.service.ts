import { AppError } from "../../error/error-handler";
import { Prisma, User } from "../../generated/prisma/client";
import { comparePassword, hashPassword } from "../../utils/password";
import { UserRepository } from "./user.repository";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  private async checkUserExists(userId: string) {
    const currentUser = await this.userRepo.getUserById(userId);
    if (!currentUser) throw new AppError("Account no longer exists.", 404);
    const { password, ...payload } = currentUser;

    const user = {
      hasPassword: password !== null,
      ...payload,
    };
    return user;
  }

  async getUser(user: User) {
    const currentUser = await this.checkUserExists(user.id);
    return currentUser;
  }

  async updateUserProfile(user: User, updateData: Partial<User>) {
    await this.checkUserExists(user.id);
    const updatedUser = await this.userRepo.updateUserById(user.id, updateData);
    return updatedUser;
  }

  async updateUserPassword(
    user: User,
    data: { currentPassword: string; newPassword: string },
  ) {
    const currentUser = await this.userRepo.getFullUserById(user.id);

    if (!currentUser) throw new AppError("Account no longer exists.", 404);

    const { currentPassword, newPassword } = data;

    if (!currentUser.password) {
      if (!currentPassword && !newPassword) {
        throw new AppError(
          "This account uses Google sign-in and has no password.",
          400,
        );
      }
      if (!currentPassword && newPassword) {
        const hashedPassword = await hashPassword(newPassword);
        await this.userRepo.updateUserById(user.id, {
          password: hashedPassword,
        });
        return true;
      }

      throw new AppError(
        "This account uses Google sign-in and has no password.",
        400,
      );
    }

    const isValidPassword = await comparePassword(
      currentUser.password,
      currentPassword,
    );
    if (!isValidPassword)
      throw new AppError("Current password is incorrect.", 401);

    const isSamePassword = await comparePassword(
      currentUser.password,
      newPassword,
    );
    if (isSamePassword)
      throw new AppError("New password must differ from the current one.", 400);

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepo.updateUserById(user.id, { password: hashedPassword });
    return true;
  }

  async getInvitations(
    user: User,
    queryParams: {
      page: number;
      limit: number;
    },
  ) {
    const { page, limit } = queryParams;
    const { id, email } = user;
    console.log(id, email);
    const where: Prisma.InvitationWhereInput = {
      OR: [{ userId: id }, { email }],
    };

    const { invitations, total } = await this.userRepo.getInvitations({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      invitations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
