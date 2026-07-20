import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { InvitationService } from "./invitation.service";
import { User } from "../../generated/prisma/client";

export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  getInvitations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { invitations, pagination } =
        await this.invitationService.getInvitations(
          user.id,
          req.params.organizationId as string,
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
}
