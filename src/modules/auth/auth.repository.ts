import { Prisma, TokenType } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export class AuthRepository {
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email, deletedAt: null } });
  }
  async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id, deletedAt: null } });
  }
  async getUserByGoogleId(googleId: string) {
    return await prisma.user.findUnique({
      where: { googleId, deletedAt: null },
    });
  }
  async createUser(data: Prisma.UserCreateInput) {
    return await prisma.user.create({ data });
  }
  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({ where: { id }, data });
  }
  async deleteUser(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async createToken(data: Prisma.TokenCreateInput) {
    return await prisma.token.create({ data });
  }
  async getToken(token: string, type: TokenType) {
    return await prisma.token.findFirst({
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
    return await prisma.token.deleteMany({ where: { userId, type } });
  }
}
