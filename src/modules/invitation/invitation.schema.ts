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
}
