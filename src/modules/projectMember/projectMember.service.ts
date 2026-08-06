import z from "zod";
import { ProjectMemberRepository } from "./projectMember.repository";
import { ProjectMemberSchema } from "./projectMember.schema";
import { ProjectRepository } from "../project/project.repository";
import { AppError } from "../../error/error-handler";
import { OrganizationRepository } from "../organization/organization.repository";

export class ProjectMemberService {
  constructor(
    private projectMemberRepo: ProjectMemberRepository,
    private projectRepo: ProjectRepository,
    private organizationRepo: OrganizationRepository,
  ) {}

  private async getProjectOrganization(projectId: string) {
    const project =
      await this.projectRepo.getProjectByIdWithoutMembershipCheck(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    const organization = await this.organizationRepo.getOrganizationById(
      project.organizationId,
    );
    if (!organization) throw new AppError("Project not found", 404);

    return organization;
  }

  async getProjectMembers(
    userId: string,
    projectId: string,
    query: z.infer<typeof ProjectMemberSchema.querySchema>,
  ) {
    const organization = await this.getProjectOrganization(projectId);

    const membership = await this.organizationRepo.getOrganizationMember(
      organization.id,
      userId,
    );
    if (!membership) throw new AppError("Project not found.", 404);

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const { projectMembers, total } =
      await this.projectMemberRepo.getProjectMembers(projectId, {
        take: limit,
        skip,
      });

    return {
      projectMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createProjectMember(
    userId: string,
    projectId: string,
    data: z.infer<typeof ProjectMemberSchema.createProjectMemberSchema>,
  ) {
    const organization = await this.getProjectOrganization(projectId);
    const { memberId } = data;

    const callerMembership = await this.organizationRepo.getOrganizationMember(
      organization.id,
      userId,
    );
    if (!callerMembership) throw new AppError("Project not found.", 404);
    if (callerMembership.role === "MEMBER") {
      throw new AppError(
        "You do not have permission to add members to this project.",
        403,
      );
    }

    const targetMembership =
      await this.organizationRepo.getOrganizationMemberByMemberId(
        organization.id,
        memberId,
      );
    if (!targetMembership) {
      throw new AppError(
        "The member you are trying to add is not part of the organization.",
        400,
      );
    }

    const existing = await this.projectMemberRepo.getProjectMember(
      projectId,
      memberId,
    );
    if (existing && existing.deletedAt === null) {
      throw new AppError("The member is already part of the project.", 400);
    }
    if (existing) {
      return await this.projectMemberRepo.restoreProjectMember(existing.id);
    }

    return await this.projectMemberRepo.createProjectMember({
      project: { connect: { id: projectId } },
      member: { connect: { id: memberId } },
    });
  }

  async removeProjectMember(
    userId: string,
    projectId: string,
    memberId: string,
  ) {
    const organization = await this.getProjectOrganization(projectId);

    const callerMembership = await this.organizationRepo.getOrganizationMember(
      organization.id,
      userId,
    );
    if (!callerMembership) throw new AppError("Project not found.", 404);
    if (callerMembership.role === "MEMBER") {
      throw new AppError(
        "You do not have permission to remove members from this project.",
        403,
      );
    }

    const targetMembership =
      await this.organizationRepo.getOrganizationMemberByMemberId(
        organization.id,
        memberId,
      );
    if (!targetMembership) {
      throw new AppError(
        "The member you are trying to remove is not part of the organization.",
        400,
      );
    }

    const existing = await this.projectMemberRepo.getProjectMember(
      projectId,
      memberId,
    );
    if (!existing || existing.deletedAt !== null) {
      throw new AppError("The member is not part of the project.", 400);
    }

    return await this.projectMemberRepo.removeProjectMember(
      projectId,
      memberId,
    );
  }
}
