import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetInvitationsArgs = {
  where?: Prisma.InvitationWhereInput;
  take?: number;
  skip?: number;
};

export class UserRepository {
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email, deletedAt: null } });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        phoneNumber: true,
        password: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async getFullUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
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
      },
    });
  }
  async getInvitations({ where, take, skip }: GetInvitationsArgs) {
    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          status: true,
          role: true,
          organizationId: true,
          createdAt: true,
          organization: { select: { name: true, slug: true } },
          invitedBy: { select: { fullName: true } },
        },
      }),
      prisma.invitation.count({ where }),
    ]);
    return { invitations, total };
  }
}
