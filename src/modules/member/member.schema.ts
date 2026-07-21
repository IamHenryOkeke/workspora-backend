import z from "zod";
import { CommonSchema } from "../../common/common.schema";

export class MemberSchema {
  static querySchema = CommonSchema.paginationQuerySchema.extend({
    role: z
      .enum(["ADMIN", "MEMBER", "OWNER"], {
        error: "Please enter a valid role value",
      })
      .optional(),
    status: z
      .enum(["PENDING", "INVITED", "ACTIVE", "SUSPENDED", "REMOVED"], {
        error: "Please enter a valid status value",
      })
      .optional(),
  });

  static createMemberSchema = z.object({
    email: z.email({ error: "Email must be valid" }).trim().toLowerCase(),
    role: z.enum(["ADMIN", "MEMBER"], {
      error: "Please enter a valid role value",
    }),
  });

  static memberParamSchema = z.object({
    organizationId: z.cuid({ error: "Invalid organization ID" }),
    memberId: z.cuid({ error: "Invalid member ID" }),
  });

  static updateMemberRoleSchema = z.object({
    role: z.enum(["ADMIN", "MEMBER", "OWNER"], {
      error: "Please enter a valid role value",
    }),
  });
}
