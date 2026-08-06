import z from "zod";
import { CommonSchema } from "../../common/common.schema";

export class ProjectMemberSchema {
  static querySchema = CommonSchema.paginationQuerySchema;
  static projectParamSchema = z.object({
    projectId: z.cuid({ error: "Invalid project ID" }),
  });

  static projectMemberParamSchema = z.object({
    projectId: z.cuid({ error: "Invalid project ID" }),
    memberId: z.cuid({ error: "Invalid member ID" }),
  });

  static createProjectMemberSchema = z.object({
    memberId: z.cuid({ error: "Invalid member ID" }),
  });
}
