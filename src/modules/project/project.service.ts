import z from "zod";
import { ProjectRepository } from "./project.repository";
import { ProjectSchema } from "./project.schema";
import { AppError } from "../../error/error-handler";
import { OrganizationRepository } from "../organization/organization.repository";
import { Prisma } from "../../generated/prisma/client";

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private organizationRepo: OrganizationRepository,
  ) {}

  private async assertMembership(userId: string, organizationId: string) {
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);
    return membership;
  }

  async getProjects(
    userId: string,
    query: z.infer<typeof ProjectSchema.querySchema>,
  ) {
    const { status, searchTerm, page, limit, organizationId } = query;

    const member = await this.assertMembership(userId, organizationId);

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
      ...(member.role === "MEMBER"
        ? {
            deletedAt: null,
            members: {
              some: { memberId: member.id, deletedAt: null },
            },
          }
        : {}),
    };

    const { projects, total } = await this.projectRepo.getProjects(
      organizationId,
      {
        where,
        take: limit,
        skip,
      },
    );

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectById(
    userId: string,
    projectId: string,
    organizationId: string,
  ) {
    const member = await this.assertMembership(userId, organizationId);

    const project = await this.projectRepo.getProjectById(
      projectId,
      organizationId,
      member.role,
      member.id,
    );

    if (!project) throw new AppError("Project not found.", 404);

    return project;
  }

  async createProject(
    userId: string,
    data: z.infer<typeof ProjectSchema.createProjectSchema>,
  ) {
    const member = await this.assertMembership(userId, data.organizationId);

    if (member.role === "MEMBER") {
      throw new AppError(
        "You do not have permission to create a project.",
        403,
      );
    }

    const projectData: Prisma.ProjectCreateInput = {
      name: data.name,
      description: data.description,
      organization: { connect: { id: data.organizationId } },
      creator: { connect: { id: userId } },
    };

    const project = await this.projectRepo.createProject(projectData);

    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    data: z.infer<typeof ProjectSchema.updateProjectSchema>,
  ) {
    const { organizationId, name, description, status } = data;
    const member = await this.assertMembership(userId, organizationId);

    if (member.role === "MEMBER") {
      throw new AppError(
        "You do not have permission to update this project.",
        403,
      );
    }

    const updated = await this.projectRepo.updateProject(
      projectId,
      organizationId,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(status && { status }),
      },
    );

    if (!updated) throw new AppError("Project not found.", 404);

    return updated;
  }

  async deleteProject(
    userId: string,
    projectId: string,
    organizationId: string,
  ) {
    const member = await this.assertMembership(userId, organizationId);

    if (member.role === "MEMBER") {
      throw new AppError(
        "You do not have permission to delete this project.",
        403,
      );
    }

    const project = await this.projectRepo.getProjectById(
      projectId,
      organizationId,
      member.role,
      member.id,
    );

    if (!project) throw new AppError("Project not found.", 404);

    if (project.status === "ACTIVE") {
      throw new AppError("Cannot delete an active project.", 400);
    }

    const deleted = await this.projectRepo.deleteProject(
      projectId,
      organizationId,
    );

    if (!deleted) throw new AppError("Project not found.", 404);

    return deleted;
  }
}
