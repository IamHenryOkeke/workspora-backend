import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { OrganizationService } from "./organization.service";
import { User } from "../../generated/prisma/client";

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  createOrganization = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const organization = await this.organizationService.createOrganization(
        user.id,
        req.body,
      );

      res.status(201).json({
        message: "Organization created successfully",
        data: {
          organization,
        },
      });
    },
  );

  getOrganizations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizations, pagination } =
        await this.organizationService.getOrganizations(
          user.id,
          req.validatedQuery,
        );

      res.status(200).json({
        message: "Organizations fetched successfully",
        data: {
          organizations,
          pagination,
        },
      });
    },
  );

  getOrganization = asyncHandler(async (req, res) => {
    const user = req.user as User;
    const { organizationId } = req.params;
    const organization = await this.organizationService.getOrganization(
      user.id,
      organizationId as string,
    );

    res.status(200).json({
      message: "Organization fetched successfully",
      data: {
        organization,
      },
    });
  });

  getOrganizationBySlug = asyncHandler(async (req, res) => {
    const user = req.user as User;
    const { organizationSlug } = req.params;
    const organization = await this.organizationService.getOrganizationBySlug(
      user.id,
      organizationSlug as string,
    );

    res.status(200).json({
      message: "Organization fetched successfully",
      data: {
        organization,
      },
    });
  });

  getOrganizationStats = asyncHandler(async (req, res) => {
    const user = req.user as User;
    const { organizationId } = req.params;
    const stats = await this.organizationService.getOrganizationStats(
      user.id,
      organizationId as string,
    );

    res.status(200).json({
      message: "Organization stats fetched successfully",
      data: {
        stats,
      },
    });
  });

  updateOrganization = asyncHandler(async (req, res) => {
    const user = req.user as User;
    const { organizationId } = req.params;
    console.log(req.body);
    const organization = await this.organizationService.updateOrganization(
      user.id,
      organizationId as string,
      req.body,
    );

    res.status(200).json({
      message: "Organization updated successfully",
      data: {
        organization: {
          id: organization.id,
          logo: organization.logo,
          name: organization.name,
          description: organization.description,
        },
      },
    });
  });

  deleteOrganization = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;
      await this.organizationService.deleteOrganization(
        user.id,
        organizationId as string,
      );

      res.status(201).json({
        message: "Organization deleted successfully",
      });
    },
  );
}
