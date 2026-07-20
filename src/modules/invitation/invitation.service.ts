import z from "zod";
import { InvitationRepository } from "./invitation.repository";
import { Prisma } from "../../generated/prisma/client";
import { InvitationSchema } from "./invitation.schema";
import { OrganizationRepository } from "../organization/organization.repository";
import { AppError } from "../../error/error-handler";

export class InvitationService {
  constructor(
    private invitationRepo: InvitationRepository,
    private organizationRepo: OrganizationRepository,
  ) {}

  private async assertAdminPrivilege(userId: string, organizationId: string) {
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
    if (!organization) throw new AppError("Organization not found.", 404);

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

  async getInvitations(
    userId: string,
    organizationId: string,
    query: z.infer<typeof InvitationSchema.querySchema>,
  ) {
    await this.assertAdminPrivilege(userId, organizationId);
    const { page, limit, searchTerm, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvitationWhereInput = {
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
}
