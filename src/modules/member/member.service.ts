import { MemberRepository } from "./member.repository";
import z from "zod";
import { MemberSchema } from "./member.schema";
import {
  MemberRole,
  MemberStatus,
  Prisma,
} from "../../generated/prisma/client";
import { AppError } from "../../error/error-handler";
import { OrganizationRepository } from "../organization/organization.repository";
import { emailQueue } from "../../queues/email.queue";
import { queueConfig } from "../../utils/queue-config";

export class MemberService {
  constructor(
    private memberRepo: MemberRepository,
    private organizationRepo: OrganizationRepository,
  ) {}

  private async assertMembership(userId: string, organizationId: string) {
    const organization = await this.organizationRepo.getOrganizationById(
      organizationId,
      userId,
    );
    if (!organization) throw new AppError("Organization not found.", 404);

    if (!organization.role) throw new AppError("Organization not found.", 404);
  }

  async getMembers(
    userId: string,
    organizationId: string,
    query: z.infer<typeof MemberSchema.querySchema>,
  ) {
    await this.assertMembership(userId, organizationId);

    const { page, limit, searchTerm, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {
      ...(searchTerm && {
        OR: [
          {
            user: { fullName: { contains: searchTerm, mode: "insensitive" } },
          },
          { user: { email: { contains: searchTerm, mode: "insensitive" } } },
        ],
      }),
      ...(role && { role }),
      ...(status && { status }),
    };

    const { members, total } = await this.memberRepo.getMembers(
      organizationId,
      {
        where,
        take: limit,
        skip,
      },
    );

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMember(userId: string, organizationId: string, memberId: string) {
    await this.assertMembership(userId, organizationId);

    const member = await this.memberRepo.getMemberById(
      memberId,
      organizationId,
    );
    if (!member) throw new AppError("Member not found.", 404);

    return member;
  }

  async updateMemberRole(
    userId: string,
    organizationId: string,
    memberId: string,
    data: { role: MemberRole },
  ) {
    const callerMembership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!callerMembership) throw new AppError("Organization not found.", 404);

    const target = await this.memberRepo.getMemberById(
      memberId,
      organizationId,
    );
    if (!target) throw new AppError("Member not found.", 404);

    const canManage =
      callerMembership.role === MemberRole.OWNER ||
      callerMembership.role === MemberRole.ADMIN;
    if (!canManage)
      throw new AppError(
        "You don't have permission to change member roles.",
        403,
      );

    if (target.role === MemberRole.OWNER)
      throw new AppError(
        "The organization owner's role cannot be changed here.",
        403,
      );

    if (callerMembership.role === MemberRole.ADMIN) {
      if (data.role === MemberRole.ADMIN || target.role === MemberRole.ADMIN)
        throw new AppError("Only the owner can manage admin roles.", 403);
    }
    const member = await this.memberRepo.updateMember(
      memberId,
      organizationId,
      data,
    );
    if (!member) throw new AppError("Member not found.", 404);

    const { email, fullName } = member.user;

    await emailQueue.add(
      "send-role-update-email",
      {
        title: "Role updated",
        to: email,
        name: fullName,
        content: `
          <div>
            <p>Hello ${fullName},</p>
            <p>Your role in <strong>${member.organization.name}</strong> has been updated to <strong>${data.role}</strong>.</p>
            <p>If you weren't expecting this change, please contact your organization administrator.</p>
          </div>
        `,
      },
      queueConfig,
    );
    return member;
  }

  async removeMember(userId: string, organizationId: string, memberId: string) {
    const callerMembership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!callerMembership) throw new AppError("Organization not found.", 404);

    const target = await this.memberRepo.getMemberById(
      memberId,
      organizationId,
    );
    if (!target) throw new AppError("Member not found.", 404);

    const canManage =
      callerMembership.role === MemberRole.OWNER ||
      callerMembership.role === MemberRole.ADMIN;
    if (!canManage)
      throw new AppError("You don't have permission to remove member.", 403);

    if (target.role === MemberRole.OWNER)
      throw new AppError("The organization owner cannot be removed.", 403);

    if (
      callerMembership.role !== MemberRole.OWNER &&
      target.role === MemberRole.ADMIN
    ) {
      throw new AppError("Only the owner can remove admin members.", 403);
    }

    const member = await this.memberRepo.updateMember(
      memberId,
      organizationId,
      {
        status: MemberStatus.REMOVED,
        deletedAt: new Date(),
      },
    );

    if (!member) throw new AppError("Member not found.", 404);

    const { email, fullName } = member.user;

    await emailQueue.add(
      "send-member-removed-email",
      {
        title: "Removed from organization",
        to: email,
        name: fullName,
        content: `
          <div>
            <p>Hello ${fullName},</p>
            <p>You have been removed from <strong>${member.organization.name}</strong>.</p>
            <p>If you weren't expecting this change, please contact your organization administrator.</p>
          </div>
        `,
      },
      queueConfig,
    );
    return member;
  }
}
