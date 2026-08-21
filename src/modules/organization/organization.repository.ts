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
          members: {
            where: { userId, deletedAt: null },
            select: { role: true },
            take: 1,
          },
        },
      }),
      prisma.organization.count({ where: scopedWhere }),
    ]);

    // Flatten members[0].role into a top-level `role` field
    const organizationsWithRole = organizations.map(({ members, ...org }) => ({
      ...org,
      role: members[0]?.role ?? null,
    }));

    return { organizations: organizationsWithRole, total };
  }

  async getOrganizationById(
    id: string,
    userId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    const organization = await tx.organization.findUnique({
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
        members: {
          where: { userId, deletedAt: null },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!organization) return null;

    const { members, ...org } = organization;
    return { ...org, role: members[0]?.role ?? null };
  }
  async getOrganizationBySlug(
    slug: string,
    userId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    const organization = await tx.organization.findUnique({
      where: {
        slug,
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
        members: {
          where: { userId, deletedAt: null },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!organization) return null;

    const { members, ...org } = organization;
    return { ...org, role: members[0]?.role ?? null };
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
  async getOrganizationMemberByMemberId(
    organizationId: string,
    memberId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.member.findFirst({
      where: { organizationId, id: memberId, deletedAt: null },
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
    const [
      totalMembers,
      membersByRole,
      membersByStatus,
      totalProjects,
      projectsByStatus,
    ] = await Promise.all([
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
      tx.project.count({ where: { organizationId, deletedAt: null } }),
      tx.project.groupBy({
        by: ["status"],
        where: { organizationId, deletedAt: null },
        _count: true,
      }),
    ]);

    return {
      totalMembers,
      membersByRole,
      membersByStatus,
      totalProjects,
      projectsByStatus,
    };
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
