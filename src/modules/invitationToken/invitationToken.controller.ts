import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { InvitationTokenService } from "./invitationToken.service";
import { User } from "../../generated/prisma/client";

export class InvitationTokenController {
  constructor(private invitationTokenService: InvitationTokenService) {}

  previewInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.params;
      const invitationDetails =
        await this.invitationTokenService.previewInvitation(token as string);

      res.status(200).json({
        message: "Invitation preview fetched successfully",
        data: invitationDetails,
      });
    },
  );

  acceptInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { token } = req.params;
      await this.invitationTokenService.acceptInvitation(token as string, user);

      res.status(200).json({ message: "Invitation accepted successfully" });
    },
  );

  declineInvitation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.params;
      const user = req.user as User;

      await this.invitationTokenService.declineInvitation(
        token as string,
        user,
      );

      res.status(200).json({ message: "Invitation declined successfully" });
    },
  );
}
