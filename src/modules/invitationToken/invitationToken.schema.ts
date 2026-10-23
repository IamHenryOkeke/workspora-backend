import z from "zod";

export class InvitationTokenSchema {
  static invitationTokenParamSchema = z.object({
    token: z.string().min(1, { message: "Token is required" }),
  });
}
