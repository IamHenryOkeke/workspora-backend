import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { InvitationService } from "./invitation.service";
import { User } from "../../generated/prisma/client";

export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  getInvitations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;

      const { invitations, pagination } =
        await this.invitationService.getInvitations(
          user.id,
          organizationId as string,
          req.validatedQuery,
        );

      res.status(200).json({
        message: "Invitations fetched successfully",
        data: {
          invitations,
          pagination,
        },
      });
    },
  );

  getInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, invitationId } = req.params;

      const invitation = await this.invitationService.getInvitationById(
        user.id,
        organizationId as string,
        invitationId as string,
      );

      res.status(200).json({
        message: "Invitation fetched successfully",
        data: {
          invitation,
        },
      });
    },
  );

  createInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;

      const invitation = await this.invitationService.createInvitation(
        user.id,
        organizationId as string,
        req.body,
      );

      res.status(201).json({
        message: "Invitation created successfully",
        data: {
          invitation,
        },
      });
    },
  );

  revokeInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, invitationId } = req.params;

      await this.invitationService.revokeInvitation(
        user.id,
        organizationId as string,
        invitationId as string,
      );

      res.status(200).json({
        message: "Invitation revoked successfully",
      });
    },
  );

  resendInvitationEmail = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, invitationId } = req.params;

      await this.invitationService.resendInvitationEmail(
        user.id,
        organizationId as string,
        invitationId as string,
      );

      res.status(200).json({
        message: "Invitation email resent successfully",
      });
    },
  );
}
