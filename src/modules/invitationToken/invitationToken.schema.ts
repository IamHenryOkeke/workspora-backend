import z from "zod";

export class InvitationTokenSchema {
  static invitationTokenParamSchema = z.object({
    tokenId: z.string().min(1, { message: "Token ID is required" }),
  });
}
