import { prisma } from "../../lib/prisma";

export class UserRepository {
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        phoneNumber: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
