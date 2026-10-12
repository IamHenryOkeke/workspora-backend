import z from "zod";
import { InvitationRepository } from "./invitation.repository";
import {
  InvitationStatus,
  MemberRole,
  Prisma,
} from "../../generated/prisma/client";
import { InvitationSchema } from "./invitation.schema";
import { OrganizationRepository } from "../organization/organization.repository";
import { AppError } from "../../error/error-handler";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";
import { generateToken } from "../../utils/token";
import { getEnv } from "../../config/env";
import { organizationInvitationEmail } from "../../email-templates";
import { UserRepository } from "../user/user.repository";

const FRONTEND_URL = getEnv("FRONTEND_URL");

export class InvitationService {
  constructor(
    private invitationRepo: InvitationRepository,
    private organizationRepo: OrganizationRepository,
    private userRepo: UserRepository,
  ) {}

  private async assertAdminPrivilege(userId: string, organizationId: string) {
    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      throw new AppError(
        "You do not have permission to perform this action.",
        403,
      );
    }
  }

  private async sendInvitationEmail(
    invitation: {
      email: string;
      role: MemberRole;
      organization: { name: string };
      invitedBy: {
        fullName: string;
      };
    },
    rawToken: string,
  ) {
    const invitationLink = `${FRONTEND_URL}/invitations/accept?token=${rawToken}`;
    await emailQueue
      .add(
        "send-invitation-email",
        {
          title: `You've been invited to ${invitation.organization.name}`,
          to: invitation.email,
          content: organizationInvitationEmail(
            invitation.organization.name,
            invitation.role,
            invitationLink,
            invitation.invitedBy.fullName,
          ),
        },
        queueConfig,
      )
      .catch((err) => console.error("Failed to queue invitation email:", err));
  }

  async getInvitations(
    userId: string,
    organizationId: string,
    query: z.infer<typeof InvitationSchema.querySchema>,
  ) {
    await this.assertAdminPrivilege(userId, organizationId);
    const { page, limit, searchTerm, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvitationWhereInput = {
      organizationId,
      ...(searchTerm && {
        email: { contains: searchTerm, mode: "insensitive" },
      }),
      ...(role && { role }),
      ...(status && { status }),
    };

    const { invitations, total } = await this.invitationRepo.getInvitations(
      organizationId,
      {
        where,
        take: limit,
        skip,
      },
    );

    return {
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvitationById(
    userId: string,
    organizationId: string,
    invitationId: string,
  ) {
    await this.assertAdminPrivilege(userId, organizationId);

    const invitation = await this.invitationRepo.getInvitationById(
      organizationId,
      invitationId,
    );

    if (!invitation) {
      throw new AppError("Invitation not found.", 404);
    }

    return invitation;
  }

  async createInvitation(
    userId: string,
    organizationId: string,
    data: z.infer<typeof InvitationSchema.createInvitationSchema>,
  ) {
    console.log(
      "Creating invitation for userId:",
      userId,
      "organizationId:",
      organizationId,
      "data:",
      data,
    );
    await this.assertAdminPrivilege(userId, organizationId);

    const existingInvitation = await this.invitationRepo.getPendingInvitation(
      organizationId,
      data.email,
    );

    if (existingInvitation) {
      throw new AppError(
        "An invitation has already been sent to this email address.",
        400,
      );
    }

    const existingMember =
      await this.organizationRepo.getOrganizationMemberByEmail(
        organizationId,
        data.email,
      );

    if (existingMember) {
      throw new AppError(
        "This user is already a member of the organization.",
        400,
      );
    }

    const { raw, hashed } = generateToken();

    const existingUserByEmail = await this.userRepo.getUserByEmail(data.email);

    const inviteData: Prisma.InvitationCreateInput = {
      email: data.email,
      ...(existingUserByEmail && {
        user: { connect: { id: existingUserByEmail.id } },
      }),
      role: data.role as MemberRole,
      organization: { connect: { id: organizationId } },
      status: InvitationStatus.PENDING,
      token: hashed,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: { connect: { id: userId } },
    };

    const { email, organization, invitedBy } =
      await this.invitationRepo.createInvitation(inviteData);

    await this.sendInvitationEmail(
      { email, role: data.role as MemberRole, organization, invitedBy },
      raw,
    );

    return {
      email,
      role: data.role,
      status: InvitationStatus.PENDING,
      expiresAt: inviteData.expiresAt,
    };
  }

  async revokeInvitation(
    userId: string,
    organizationId: string,
    invitationId: string,
  ) {
    await this.assertAdminPrivilege(userId, organizationId);

    const existingInvitation = await this.invitationRepo.getInvitationById(
      invitationId,
      organizationId,
    );

    if (!existingInvitation) {
      throw new AppError("Invitation not found.", 404);
    }

    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new AppError("Only pending invitations can be revoked.", 400);
    }

    const invitation = await this.invitationRepo.updateInvitation(
      invitationId,
      {
        status: InvitationStatus.REVOKED,
      },
    );

    return invitation;
  }

  async resendInvitationEmail(
    userId: string,
    organizationId: string,
    invitationId: string,
  ) {
    await this.assertAdminPrivilege(userId, organizationId);

    const existingInvitation = await this.invitationRepo.getInvitationById(
      organizationId,
      invitationId,
    );

    if (!existingInvitation) {
      throw new AppError("Invitation not found.", 404);
    }

    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new AppError("Only pending invitations can be resent.", 400);
    }

    const { raw, hashed } = generateToken();

    const updatedInvitation = await this.invitationRepo.updateInvitation(
      invitationId,
      {
        token: hashed,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    );

    const { email, role, organization, invitedBy } = updatedInvitation;

    await this.sendInvitationEmail(
      {
        email,
        role,
        organization,
        invitedBy,
      },
      raw,
    );

    return updatedInvitation;
  }
}
