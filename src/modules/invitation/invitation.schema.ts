import z from "zod";
import { CommonSchema } from "../../common/common.schema";
import { OrganizationSchema } from "../organization/organization.schema";

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

  static invitationParamSchema =
    OrganizationSchema.organizationParamSchema.extend({
      invitationId: z.cuid({ error: "Invalid invitation ID" }),
    });

  static createInvitationSchema = z.object({
    email: z.email({ error: "Invalid email address" }).toLowerCase(),
    role: z.enum(["ADMIN", "MEMBER"], {
      error: "Please enter a valid role value",
    }),
  });
}
