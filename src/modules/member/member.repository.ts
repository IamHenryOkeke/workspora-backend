import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetMembersArgs = {
  where?: Prisma.MemberWhereInput;
  take?: number;
  skip?: number;
};

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const memberSelect = {
  id: true,
  organizationId: true,
  userId: true,
  role: true,
  status: true,
  createdAt: true,
  deletedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      avatar: true,
    },
  },
  organization: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.MemberSelect;

export class MemberRepository {
  async getMembers(
    organizationId: string,
    { where, take, skip }: GetMembersArgs,
    tx: PrismaTransactionClient = prisma,
  ) {
    const scopedWhere: Prisma.MemberWhereInput = {
      ...where,
      organizationId,
      deletedAt: null,
    };
    const [members, total] = await Promise.all([
      tx.member.findMany({
        where: scopedWhere,
        take,
        skip,
        select: memberSelect,
      }),
      tx.member.count({ where: scopedWhere }),
    ]);
    return { members, total };
  }

  async getMemberById(
    id: string,
    organizationId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: memberSelect,
    });
  }

  async createMember(
    data: Prisma.MemberCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.create({
      data,
      select: memberSelect,
    });
  }

  async updateMember(
    id: string,
    organizationId: string,
    data: Prisma.MemberUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.update({
      where: { id, organizationId, deletedAt: null },
      data,
      select: memberSelect,
    });
  }

  async restoreMember(
    id: string,
    data: Prisma.MemberUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.update({
      where: { id },
      data,
      select: memberSelect,
    });
  }

  async getMemberByOrgAndUser(
    organizationId: string,
    userId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.findFirst({
      where: { organizationId, userId },
      select: memberSelect,
    });
  }
}
