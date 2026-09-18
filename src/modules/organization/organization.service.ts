import z from "zod";
import { AppError } from "../../error/error-handler";
import {
  MemberRole,
  MemberStatus,
  Prisma,
} from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { generateSlug } from "../../utils/slug";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationSchema } from "./organization.schema";

export type OrganizationActivity = {
  type: "member_joined" | "invitation_sent" | "project_created";
  id: string;
  timestamp: Date;
  text: string;
  meta?: Record<string, unknown>;
};
export class OrganizationService {
  constructor(private organizationRepo: OrganizationRepository) {}

  private async assertMembership(userId: string, organizationId: string) {
    const organization = await this.organizationRepo.getOrganizationById(
      organizationId,
      userId,
    );
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);
    return { organization, membership };
  }

  async getOrganizations(
    userId: string,
    query: z.infer<typeof OrganizationSchema.querySchema>,
  ) {
    const { page, limit, searchTerm } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {};

    const { organizations, total } =
      await this.organizationRepo.getOrganizations(userId, {
        where,
        take: limit,
        skip,
      });

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganization(userId: string, organizationId: string) {
    const { organization } = await this.assertMembership(
      userId,
      organizationId,
    );
    return organization;
  }

  async getOrganizationBySlug(userId: string, organizationSlug: string) {
    const organization = await this.organizationRepo.getOrganizationBySlug(
      organizationSlug,
      userId,
    );
    if (!organization) throw new AppError("Organization not found.", 404);

    await this.assertMembership(userId, organization.id);

    return organization;
  }

  async getOrganizationStats(userId: string, organizationId: string) {
    const { membership } = await this.assertMembership(userId, organizationId);

    const stats = await this.organizationRepo.getOrganizationStats(
      organizationId,
      membership.role,
    );

    return stats;
  }

  async getOrganizationRecentActivities(
    userId: string,
    organizationId: string,
  ) {
    await this.assertMembership(userId, organizationId);

    const [newMembers, sentInvitations, newProjects] = await Promise.all([
      prisma.member.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          role: true,
          status: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
      }),

      prisma.invitation.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          invitedBy: { select: { fullName: true } },
        },
      }),

      prisma.project.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          creator: { select: { fullName: true } },
        },
      }),
    ]);

    const activities: OrganizationActivity[] = [
      ...newMembers.map<OrganizationActivity>((m) => ({
        type: "member_joined",
        id: `member-${m.id}`,
        timestamp: m.createdAt,
        text: `${m.user.fullName} joined as ${m.role.toLowerCase()}`,
        meta: { role: m.role, status: m.status },
      })),

      ...sentInvitations.map<OrganizationActivity>((i) => ({
        type: "invitation_sent",
        id: `invitation-${i.id}`,
        timestamp: i.createdAt,
        text: `${i.invitedBy.fullName} invited ${i.email}`,
        meta: { status: i.status },
      })),

      ...newProjects.map<OrganizationActivity>((p) => ({
        type: "project_created",
        id: `project-${p.id}`,
        timestamp: p.createdAt,
        text: `${p.creator?.fullName ?? "Someone"} created "${p.name}" project`,
        meta: { status: p.status },
      })),
    ];

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  async createOrganization(
    userId: string,
    data: { name: string; description: string; logo: string },
  ) {
    const slug = generateSlug(data.name);
    const organization = await prisma.$transaction(async (tx) => {
      const existingOrg = await this.organizationRepo.getOrganizationBySlug(
        slug,
        userId,
        tx,
      );
      if (existingOrg)
        throw new AppError("Organization with this name already exists.", 409);

      const newOrg = await this.organizationRepo.createOrganization(
        {
          name: data.name,
          description: data.description,
          logo: data.logo,
          slug,
          owner: { connect: { id: userId } },
          members: {
            create: {
              userId: userId,
              role: MemberRole.OWNER,
              status: MemberStatus.ACTIVE,
            },
          },
        },
        tx,
      );
      return newOrg;
    });

    return organization;
  }

  async updateOrganization(
    userId: string,
    organizationId: string,
    data: z.infer<typeof OrganizationSchema.updateOrganizationSchema>,
  ) {
    const organization = await this.organizationRepo.getOrganizationById(
      organizationId,
      userId,
    );
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);

    const canUpdate =
      membership.role === MemberRole.OWNER ||
      membership.role === MemberRole.ADMIN;
    if (!canUpdate)
      throw new AppError(
        "You don't have permission to update this organization.",
        403,
      );

    return this.organizationRepo.updateOrganization(organizationId, data);
  }

  async deleteOrganization(userId: string, organizationId: string) {
    const organization = await this.organizationRepo.getOrganizationById(
      organizationId,
      userId,
    );
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);

    const canDelete = membership.role === MemberRole.OWNER;
    if (!canDelete)
      throw new AppError(
        "You don't have permission to delete this organization.",
        403,
      );

    await this.organizationRepo.deleteOrganization(organizationId);

    return true;
  }
}
