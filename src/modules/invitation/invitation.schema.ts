import z from "zod";
import { CommonSchema } from "../../common/common.schema";

export class InvitationSchema {
  static querySchema = CommonSchema.paginationQuerySchema.extend({
    role: z
      .enum(["ADMIN", "MEMBER", "OWNER"], {
        error: "Please enter a valid role value",
      })
      .optional(),
    status: z
      .enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED"], {
        error: "Please enter a valid status value",
      })
      .optional(),
  });

  static invitationParamSchema = z.object({
    organizationId: z.cuid({ error: "Invalid organization ID" }),
    invitationId: z.cuid({ error: "Invalid invitation ID" }),
  });

  static createInvitationSchema = z.object({
    email: z.string().email({ error: "Invalid email address" }),
    role: z.enum(["ADMIN", "MEMBER"], {
      error: "Please enter a valid role value",
    }),
  });
}
