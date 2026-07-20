import {
  InvitationStatus,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetInvitationsArgs = {
  where?: Prisma.InvitationWhereInput;
  take?: number;
  skip?: number;
};

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

export class InvitationRepository {
  async getInvitations(
    organizationId: string,
    { where, take, skip }: GetInvitationsArgs,
    tx: PrismaTransactionClient = prisma,
  ) {
    const scopedWhere: Prisma.InvitationWhereInput = {
      ...where,
      organizationId,
    };
    const [invitations, total] = await Promise.all([
      tx.invitation.findMany({
        where: scopedWhere,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: invitationSelect,
      }),
      tx.invitation.count({ where: scopedWhere }),
    ]);
    return { invitations, total };
  }

  async getInvitationById(
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
    });
  }

  async getPendingInvitation(
    organizationId: string,
    email: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.invitation.findFirst({
      where: { organizationId, email, status: InvitationStatus.PENDING },
    });
  }

  async createInvitation(
    data: Prisma.InvitationCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.invitation.create({ data, select: invitationSelect });
  }

  async updateInvitation(
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
