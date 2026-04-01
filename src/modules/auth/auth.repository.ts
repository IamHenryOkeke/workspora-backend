import { prisma } from "../../lib/prisma";
export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: { email: string; password: string }) {
    return prisma.user.create({ data });
  }
}
