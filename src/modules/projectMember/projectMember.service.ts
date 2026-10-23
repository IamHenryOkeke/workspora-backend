import z from "zod";
import { ProjectMemberRepository } from "./projectMember.repository";
import { ProjectMemberSchema } from "./projectMember.schema";
import { ProjectRepository } from "../project/project.repository";
import { AppError } from "../../error/error-handler";
import { OrganizationRepository } from "../organization/organization.repository";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";
import { addedToProjectEmail } from "../../email-templates";
import { getEnv } from "../../config/env";

const FRONTEND_URL = getEnv("FRONTEND_URL");

export class ProjectMemberService {
  constructor(
    private projectMemberRepo: ProjectMemberRepository,
    private projectRepo: ProjectRepository,
    private organizationRepo: OrganizationRepository,
  ) {}

  private async getCallerContext(userId: string, organizationId: string) {
    const organization = await this.organizationRepo.getOrganizationById(
      organizationId,
      userId,
    );
    if (!organization) throw new AppError("Project not found", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organization.id,
      userId,
    );
    if (!membership) throw new AppError("Project not found.", 404);

    return { organization, membership };
  }

  private async getManagerContext(
    userId: string,
    organizationId: string,
    action: "add members to" | "remove members from",
  ) {
    const context = await this.getCallerContext(userId, organizationId);
    if (context.membership.role === "MEMBER") {
      throw new AppError(
        `You do not have permission to ${action} this project.`,
        403,
      );
    }

    return context;
  }

  private async assertOrganizationMember(
    organizationId: string,
    memberId: string,
    action: "add" | "remove",
  ) {
    const targetMembership =
      await this.organizationRepo.getOrganizationMemberByMemberId(
        organizationId,
        memberId,
      );
    if (!targetMembership) {
      throw new AppError(
        `The member you are trying to ${action} is not part of the organization.`,
        400,
      );
    }
  }

  async getProjectMembers(
    userId: string,
    projectId: string,
    organizationId: string,
  ) {
    await this.getCallerContext(userId, organizationId);

    return await this.projectMemberRepo.getProjectMembers(projectId);
  }

  async createProjectMember(
    userId: string,
    projectId: string,
    organizationId: string,
    data: z.infer<typeof ProjectMemberSchema.createProjectMemberSchema>,
  ) {
    const { organization } = await this.getManagerContext(
      userId,
      organizationId,
      "add members to",
    );
    const { memberId } = data;

    await this.assertOrganizationMember(organization.id, memberId, "add");

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

    const newProjectMember = await this.projectMemberRepo.createProjectMember({
      project: { connect: { id: projectId } },
      member: { connect: { id: memberId } },
    });

    const {
      member: {
        user: { email, fullName },
      },
      project: {
        name: projectName,
        organization: { name: organizationName },
      },
    } = newProjectMember;

    const projectUrl = `${FRONTEND_URL}/dashboard/org/${organization.slug}/projects`;

    await emailQueue.add(
      "send-new-project-member-email",
      {
        title: "You've been added to a project",
        to: email,
        content: addedToProjectEmail(
          fullName,
          projectName,
          organizationName,
          projectUrl,
        ),
      },
      queueConfig,
    );

    return newProjectMember;
  }

  async removeProjectMember(
    userId: string,
    projectId: string,
    organizationId: string,
    memberId: string,
  ) {
    await this.getManagerContext(userId, organizationId, "remove members from");

    const existing = await this.projectMemberRepo.getProjectMember(
      projectId,
      memberId,
    );

    console.log(existing);

    if (!existing || existing.deletedAt !== null) {
      throw new AppError("The member is not part of the project.", 400);
    }

    return await this.projectMemberRepo.removeProjectMember(
      projectId,
      memberId,
    );
  }
}
