import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetInvitationsArgs = {
  where?: Prisma.MemberWhereInput;
  take?: number;
  skip?: number;
};
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

  async getFullUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUserById(id: string, updateData: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data: updateData,
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

  async getInvitations({ where, take, skip }: GetInvitationsArgs) {
    const [invitations, total] = await Promise.all([
      prisma.member.findMany({
        where,
        take,
        skip,
      }),
      prisma.member.count({ where }),
    ]);

    return { invitations, total };
  }
}
