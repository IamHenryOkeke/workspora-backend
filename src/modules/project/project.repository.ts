import {
  MemberRole,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

type GetProjectsArgs = {
  where?: Prisma.ProjectWhereInput;
  take?: number;
  skip?: number;
};

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  organizationId: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  creator: {
    select: {
      id: true,
      fullName: true,
      avatar: true,
    },
  },
} satisfies Prisma.ProjectSelect;

export class ProjectRepository {
  async getProjects(
    organizationId: string,
    { where, take, skip }: GetProjectsArgs,
    tx: PrismaTransactionClient = prisma,
  ) {
    const scopedWhere: Prisma.ProjectWhereInput = {
      ...where,
      organizationId,
      deletedAt: null,
    };
    const [projects, total] = await Promise.all([
      tx.project.findMany({
        where: scopedWhere,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: projectSelect,
      }),
      tx.project.count({ where: scopedWhere }),
    ]);
    return { projects, total };
  }

  async getProjectById(
    id: string,
    organizationId: string,
    role: MemberRole,
    memberId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.project.findFirst({
      where: {
        id,
        organizationId,
        ...(role === "MEMBER" && {
          deletedAt: null,
          members: { some: { memberId, deletedAt: null } },
        }),
      },
      select: projectSelect,
    });
  }

  async getProjectByIdWithoutMembershipCheck(
    id: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.project.findFirst({
      where: { id, deletedAt: null },
      select: projectSelect,
    });
  }

  async createProject(
    data: Prisma.ProjectCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.project.create({ data, select: projectSelect });
  }

  async updateProject(
    id: string,
    organizationId: string,
    data: Prisma.ProjectUpdateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.project.update({
      where: { id, organizationId, deletedAt: null },
      data,
      select: projectSelect,
    });
  }

  async deleteProject(
    id: string,
    organizationId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.project.update({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: projectSelect,
    });
  }
}
