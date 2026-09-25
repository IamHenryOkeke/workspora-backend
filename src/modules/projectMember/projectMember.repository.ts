import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

// type GetProjectMembersArgs = {
//   where?: Prisma.ProjectMemberWhereInput;
//   take?: number;
//   skip?: number;
// };

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const projectMemberSelect = {
  id: true,
  projectId: true,
  createdAt: true,
  project: {
    select: {
      name: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  },
  member: {
    select: {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatar: true,
        },
      },
    },
  },
} satisfies Prisma.ProjectMemberSelect;

export class ProjectMemberRepository {
  // async getProjectMembers(
  //   projectId: string,
  //   { where, take, skip }: GetProjectMembersArgs,
  //   tx: PrismaTransactionClient = prisma,
  // ) {
  //   const scopedWhere: Prisma.ProjectMemberWhereInput = {
  //     ...where,
  //     projectId,
  //     deletedAt: null,
  //   };
  //   const [projectMembers, total] = await Promise.all([
  //     tx.projectMember.findMany({
  //       where: scopedWhere,
  //       take,
  //       skip,
  //       orderBy: { createdAt: "desc" },
  //       select: projectMemberSelect,
  //     }),
  //     tx.projectMember.count({ where: scopedWhere }),
  //   ]);
  //   return { projectMembers, total };
  // }

  async getProjectMembers(
    projectId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    const projectMembers = await tx.projectMember.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      select: projectMemberSelect,
    });

    return projectMembers;
  }

  async getProjectMember(
    projectId: string,
    memberId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.projectMember.findUnique({
      where: { projectId_memberId: { projectId, memberId } },
    });
  }

  async createProjectMember(
    data: Prisma.ProjectMemberCreateInput,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.projectMember.create({ data, select: projectMemberSelect });
  }

  async restoreProjectMember(id: string, tx: PrismaTransactionClient = prisma) {
    return await tx.projectMember.update({
      where: { id },
      data: { deletedAt: null },
      select: projectMemberSelect,
    });
  }

  async removeProjectMember(
    projectId: string,
    memberId: string,
    tx: PrismaTransactionClient = prisma,
  ) {
    return await tx.projectMember.updateMany({
      where: { projectId, memberId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
