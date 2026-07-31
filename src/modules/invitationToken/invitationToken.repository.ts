import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const invitationSelect = {
  id: true,
  organizationId: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  invitedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.InvitationSelect;

export class InvitationTokenRepository {
  async getUserInvitationById(
    id: string,
    organizationId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.invitation.findFirst({
      where: { id, organizationId },
      select: invitationSelect,
    });
  }

  async getInvitationByToken(
    token: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        organizationId: true,
        token: true,
        organization: { select: { id: true, name: true, logo: true } },
        invitedBy: { select: { fullName: true } },
      },
    });
  }

  async updateUserInvitation(
    id: string,
    data: Prisma.InvitationUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.invitation.update({
      where: { id },
      data,
      select: invitationSelect,
    });
  }
}
