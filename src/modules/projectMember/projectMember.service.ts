import z from "zod";
import { ProjectMemberRepository } from "./projectMember.repository";
import { ProjectMemberSchema } from "./projectMember.schema";
import { ProjectRepository } from "../project/project.repository";
import { AppError } from "../../error/error-handler";
import { OrganizationRepository } from "../organization/organization.repository";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";
import {
  addedToProjectEmail,
  removedFromProjectEmail,
} from "../../email-templates";
import { getEnv } from "../../config/env";
import { prisma } from "../../lib/prisma";

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

    // Remove duplicate IDs from the request.
    const memberIds = [...new Set(data.memberIds)];

    if (memberIds.length === 0) {
      throw new AppError("At least one member is required.", 400);
    }

    // Ensure the project belongs to this organization.
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: organization.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      console.log(1);
      throw new AppError("Project not found.", 404);
    }

    // Ensure every selected member belongs to the organization.
    await Promise.all(
      memberIds.map((memberId) =>
        this.assertOrganizationMember(organization.id, memberId, "add"),
      ),
    );

    // Reject the request if any member is already active.
    const existingMemberships = await Promise.all(
      memberIds.map((memberId) =>
        this.projectMemberRepo.getProjectMember(projectId, memberId),
      ),
    );

    const alreadyAdded = existingMemberships.find(
      (membership) => membership?.deletedAt === null,
    );

    if (alreadyAdded) {
      throw new AppError(
        "One or more members are already part of the project.",
        400,
      );
    }

    // Create missing memberships and restore soft-deleted ones.
    const projectMembers = await prisma.$transaction(
      memberIds.map((memberId) =>
        prisma.projectMember.upsert({
          where: {
            projectId_memberId: {
              projectId,
              memberId,
            },
          },
          update: {
            deletedAt: null,
          },
          create: {
            projectId,
            memberId,
          },
          include: {
            member: {
              include: {
                user: true,
              },
            },
            project: {
              include: {
                organization: true,
              },
            },
          },
        }),
      ),
    );

    // Notify each member after the transaction succeeds.
    await Promise.all(
      projectMembers.map((projectMember) => {
        const {
          member: {
            user: { email, fullName },
          },
          project: {
            name: projectName,
            organization: { name: organizationName, slug },
          },
        } = projectMember;

        const projectUrl = `${FRONTEND_URL}/dashboard/org/${slug}/projects`;

        return emailQueue.add(
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
      }),
    );

    return projectMembers;
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

    if (!existing || existing.deletedAt !== null) {
      throw new AppError("The member is not part of the project.", 400);
    }

    await this.projectMemberRepo.removeProjectMember(projectId, memberId);

    const { project, member } = existing;

    const projectUrl = `${FRONTEND_URL}/dashboard/org/${project.organization.slug}/projects`;

    await emailQueue.add(
      "send-project-member-removed-email",
      {
        title: `Removed from ${project.name}`,
        to: member.user.email,
        content: removedFromProjectEmail(
          member.user.fullName,
          project.name,
          project.organization.name,
          projectUrl,
        ),
      },
      queueConfig,
    );

    return true;
  }
}
