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
import {
  memberStatusUpdatedEmail,
  removedFromOrganizationEmail,
  roleUpdatedEmail,
} from "../../email-templates";

const EDITABLE_STATUSES: MemberStatus[] = [
  MemberStatus.ACTIVE,
  MemberStatus.SUSPENDED,
];

type UpdateMemberInput = z.infer<typeof MemberSchema.updateMemberSchema>;

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

  async updateMember(
    userId: string,
    organizationId: string,
    memberId: string,
    data: { role?: MemberRole; status?: MemberStatus },
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

    const isOwner = callerMembership.role === MemberRole.OWNER;
    const isAdmin = callerMembership.role === MemberRole.ADMIN;

    if (!isOwner && !isAdmin)
      throw new AppError("You don't have permission to update members.", 403);

    if (callerMembership.status !== MemberStatus.ACTIVE)
      throw new AppError("Your membership is not active.", 403);

    // Owners can't be modified through this endpoint (this also blocks owners editing themselves).
    if (target.role === MemberRole.OWNER)
      throw new AppError(
        "The organization owner cannot be modified here.",
        403,
      );

    // Admins only manage plain members (this also blocks admins editing themselves or other admins).
    if (isAdmin && target.role !== MemberRole.MEMBER)
      throw new AppError("Only the owner can manage admins.", 403);

    // Role rules
    if (data.role !== undefined) {
      if (!isOwner) throw new AppError("Only the owner can change roles.", 403);
      if (data.role === MemberRole.OWNER)
        throw new AppError("Ownership can't be assigned here.", 400);
    }

    // Status rules
    if (data.status !== undefined) {
      if (!EDITABLE_STATUSES.includes(data.status))
        throw new AppError(
          "Status can only be set to active or suspended.",
          400,
        );
      if (!EDITABLE_STATUSES.includes(target.status))
        throw new AppError(
          "Pending and invited members are managed from invitations.",
          400,
        );
    }

    const roleChanged = data.role !== undefined && data.role !== target.role;
    const statusChanged =
      data.status !== undefined && data.status !== target.status;

    if (!roleChanged && !statusChanged)
      throw new AppError("No changes to apply.", 400);

    const updates: UpdateMemberInput = {
      ...(roleChanged && data.role !== undefined && { role: data.role }),
      ...(statusChanged &&
        data.status !== undefined && {
          status: data.status as UpdateMemberInput["status"],
        }),
    };

    const member = await this.memberRepo.updateMember(
      memberId,
      organizationId,
      updates,
    );
    if (!member) throw new AppError("Member not found.", 404);

    const { email, fullName } = member.user;
    const organizationName = member.organization.name;
    const jobs: Promise<unknown>[] = [];

    if (roleChanged) {
      jobs.push(
        emailQueue.add(
          "send-role-update-email",
          {
            title: "Role updated",
            to: email,
            content: roleUpdatedEmail(fullName, organizationName, member.role),
          },
          queueConfig,
        ),
      );
    }

    if (statusChanged) {
      jobs.push(
        emailQueue.add(
          "send-status-update-email",
          {
            title:
              member.status === MemberStatus.SUSPENDED
                ? "Access suspended"
                : "Access restored",
            to: email,
            content: memberStatusUpdatedEmail(
              fullName,
              organizationName,
              member.status,
            ),
          },
          queueConfig,
        ),
      );
    }

    await Promise.all(jobs);
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
        content: removedFromOrganizationEmail(
          fullName,
          member.organization.name,
        ),
      },
      queueConfig,
    );
    return member;
  }
}
