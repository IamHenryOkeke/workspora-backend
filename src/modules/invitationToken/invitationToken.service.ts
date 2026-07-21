import { InvitationRepository } from "./invitationToken.repository";
import { OrganizationRepository } from "../organization/organization.repository";
import { MemberRepository } from "../member/member.repository";
import crypto from "crypto";
import { AppError } from "../../error/error-handler";
import { InvitationStatus } from "../../generated/prisma/enums";

export class InvitationTokenService {
  constructor(
    private invitationRepo: InvitationRepository,
    private organizationRepo: OrganizationRepository,
    private memberRepo: MemberRepository,
  ) {}

  async previewInvitation(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invitation =
      await this.invitationRepo.getInvitationByToken(hashedToken);
    if (!invitation) throw new AppError("Invalid invitation token.", 404);

    if (invitation.status !== InvitationStatus.PENDING)
      throw new AppError("This invitation is no longer valid.", 410);

    if (invitation.expiresAt < new Date()) {
      await this.invitationRepo.updateInvitation(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new AppError("This invitation has expired.", 410);
    }

    return {
      organizationName: invitation.organization.name,
      organizationLogo: invitation.organization.logo,
      inviterName: invitation.invitedBy.fullName,
      role: invitation.role,
      email: invitation.email,
    };
  }
}
