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

export class OrganizationService {
  constructor(private organizationRepo: OrganizationRepository) {}

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
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);

    return organization;
  }

  async getOrganizationStats(userId: string, organizationId: string) {
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
    if (!organization) throw new AppError("Organization not found.", 404);

    const membership = await this.organizationRepo.getOrganizationMember(
      organizationId,
      userId,
    );
    if (!membership) throw new AppError("Organization not found.", 404);

    const canViewStats =
      membership.role === MemberRole.OWNER ||
      membership.role === MemberRole.ADMIN;
    if (!canViewStats)
      throw new AppError(
        "You don't have permission to view this organization stats.",
        403,
      );

    const stats =
      await this.organizationRepo.getOrganizationStats(organizationId);
    return stats;
  }

  async createOrganization(
    userId: string,
    data: { name: string; description: string; logo: string },
  ) {
    const slug = generateSlug(data.name);
    const organization = await prisma.$transaction(async (tx) => {
      const existingOrg = await this.organizationRepo.getOrganizationBySlug(
        slug,
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
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
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
    const organization =
      await this.organizationRepo.getOrganizationById(organizationId);
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
