import { MemberRepository } from "../member/member.repository";
import { InvitationTokenRepository } from "./invitationToken.repository";
import crypto from "crypto";
import { AppError } from "../../error/error-handler";
import { InvitationStatus, MemberStatus } from "../../generated/prisma/enums";
import { User } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

export class InvitationTokenService {
  constructor(
    private invitationTokenRepo: InvitationTokenRepository,
    private memberRepo: MemberRepository,
  ) {}

  private async checkInvitationTokenValidity(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invitation =
      await this.invitationTokenRepo.getInvitationByToken(hashedToken);
    if (!invitation) throw new AppError("Invalid invitation token.", 404);

    if (invitation.status !== InvitationStatus.PENDING)
      throw new AppError("This invitation is no longer valid.", 410);

    if (invitation.expiresAt < new Date()) {
      await this.invitationTokenRepo.updateUserInvitation(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new AppError("This invitation has expired.", 410);
    }
    return invitation;
  }

  async previewInvitation(token: string) {
    const invitation = await this.checkInvitationTokenValidity(token);

    return {
      organizationName: invitation.organization.name,
      organizationLogo: invitation.organization.logo,
      inviterName: invitation.invitedBy.fullName,
      role: invitation.role,
      email: invitation.email,
    };
  }

  async acceptInvitation(token: string, user: User) {
    const invitation = await this.checkInvitationTokenValidity(token);

    if (invitation.email !== user.email) {
      throw new AppError("This invitation is not for your email address.", 403);
    }

    await prisma.$transaction(async (tx) => {
      const existingMember = await this.memberRepo.getMemberByOrgAndUser(
        invitation.organizationId,
        user.id,
        tx,
      );

      if (existingMember && existingMember.deletedAt === null) {
        throw new AppError(
          "You are already a member of this organization.",
          400,
        );
      }

      if (existingMember) {
        await this.memberRepo.restoreMember(
          existingMember.id,
          {
            role: invitation.role,
            status: MemberStatus.ACTIVE,
            deletedAt: null,
          },
          tx,
        );
      } else {
        await this.memberRepo.createMember(
          {
            user: { connect: { id: user.id } },
            organization: { connect: { id: invitation.organizationId } },
            role: invitation.role,
            status: MemberStatus.ACTIVE,
          },
          tx,
        );
      }

      await this.invitationTokenRepo.updateUserInvitation(
        invitation.id,
        { status: InvitationStatus.ACCEPTED },
        tx,
      );
    });

    return true;
  }

  async declineInvitation(token: string, user: User) {
    const invitation = await this.checkInvitationTokenValidity(token);

    if (invitation.email !== user.email) {
      throw new AppError("This invitation is not for your email address.", 403);
    }

    await this.invitationTokenRepo.updateUserInvitation(invitation.id, {
      status: InvitationStatus.DECLINED,
    });

    return true;
  }
}
