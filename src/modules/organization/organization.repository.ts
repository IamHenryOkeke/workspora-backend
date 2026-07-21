import {
  MemberRole,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetOrganizationsArgs = {
  where?: Prisma.OrganizationWhereInput;
  take?: number;
  skip?: number;
};

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
export class OrganizationRepository {
  async getOrganizations(
    userId: string,
    { where, take, skip }: GetOrganizationsArgs,
  ) {
    const scopedWhere: Prisma.OrganizationWhereInput = {
      ...where,
      deletedAt: null,
      members: { some: { userId, deletedAt: null } },
    };

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where: scopedWhere,
        take,
        skip,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          ownerId: true,
          createdAt: true,
        },
      }),
      prisma.organization.count({ where: scopedWhere }),
    ]);
    return { organizations, total };
  }
  async getOrganizationById(id: string, tx: PrismaTransactionClient = prisma) {
    return tx.organization.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        ownerId: true,
        createdAt: true,
      },
    });
  }
  async getOrganizationBySlug(
    slug: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.organization.findUnique({ where: { slug, deletedAt: null } });
  }
  async getOrganizationMember(
    organizationId: string,
    userId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.member.findFirst({
      where: { organizationId, userId, deletedAt: null },
    });
  }
  async getOrganizationMemberByEmail(
    organizationId: string,
    email: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.findFirst({
      where: { organizationId, user: { email }, deletedAt: null },
    });
  }
  async getOrganizationMembers(
    organizationId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.member.findMany({
      where: { organizationId, deletedAt: null },
      include: { user: true },
    });
  }
  async createOrganization(
    data: Prisma.OrganizationCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.organization.create({
      data,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logo: true,
      },
    });
  }
  async updateOrganization(
    id: string,
    data: Prisma.OrganizationUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.organization.update({ where: { id }, data });
  }
  async deleteOrganization(id: string, tx: PrismaTransactionClient = prisma) {
    return tx.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        members: {
          updateMany: {
            where: { deletedAt: null },
            data: { deletedAt: new Date() },
          },
        },
      },
    });
  }
  async deleteOrganizationMembers(
    id: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.member.updateMany({
      where: { organizationId: id },
      data: { deletedAt: new Date() },
    });
  }
  async getOrganizationStats(
    organizationId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    const [totalMembers, byRole, byStatus] = await Promise.all([
      tx.member.count({ where: { organizationId, deletedAt: null } }),
      tx.member.groupBy({
        by: ["role"],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),
      tx.member.groupBy({
        by: ["status"],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),
    ]);
    return { totalMembers, byRole, byStatus };
  }
  async addMemberToOrganization(
    organizationId: string,
    userId: string,
    role: MemberRole,
    tx: PrismaTransactionClient = prisma,
  ) {
    return tx.member.create({
      data: {
        organization: { connect: { id: organizationId } },
        user: { connect: { id: userId } },
        role,
      },
    });
  }
}
