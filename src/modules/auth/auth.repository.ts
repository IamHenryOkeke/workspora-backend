import { Prisma, TokenType } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export class AuthRepository {
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email, deletedAt: null } });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({ where: { id, deletedAt: null } });
  }

  async getUserByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId, deletedAt: null } });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createToken(data: Prisma.TokenCreateInput) {
    return prisma.token.create({ data });
  }

  async getToken(token: string, type: TokenType) {
    return prisma.token.findFirst({
      where: {
        token,
        type,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
      include: { user: true },
    });
  }

  async deleteTokens(userId: string, type: TokenType) {
    return prisma.token.deleteMany({
      where: {
        userId,
        type,
      },
    });
  }
}
