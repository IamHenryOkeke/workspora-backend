import { Prisma, PrismaClient, TokenType } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class AuthRepository {
  async getUserByEmail(email: string, tx: PrismaTransactionClient = prisma) {
    return await tx.user.findUnique({ where: { email, deletedAt: null } });
  }
  async getUserById(id: string, tx: PrismaTransactionClient = prisma) {
    return await tx.user.findUnique({ where: { id, deletedAt: null } });
  }
  async getUserByGoogleId(
    googleId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.user.findUnique({ where: { googleId, deletedAt: null } });
  }
  async createUser(
    data: Prisma.UserCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.user.create({ data });
  }
  async updateUser(
    id: string,
    data: Prisma.UserUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.user.update({ where: { id }, data });
  }
  async deleteUser(id: string, tx: PrismaTransactionClient = prisma) {
    return await tx.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async createToken(
    data: Prisma.TokenCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.token.create({ data });
  }
  async getToken(
    token: string,
    type: TokenType,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.token.findFirst({
      where: {
        token,
        type,
        expiresAt: { gt: new Date() },
        user: { deletedAt: null },
      },
      include: { user: true },
    });
  }
  async deleteTokens(
    userId: string,
    type: TokenType,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.token.deleteMany({ where: { userId, type } });
  }
}
