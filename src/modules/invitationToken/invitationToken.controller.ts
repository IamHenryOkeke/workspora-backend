import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { InvitationTokenService } from "./invitationToken.service";

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
}
