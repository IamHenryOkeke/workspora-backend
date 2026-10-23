import z from "zod";
import { CommonSchema } from "../../common/common.schema";
import { ProjectSchema } from "../project/project.schema";

export class ProjectMemberSchema {
  static querySchema = CommonSchema.paginationQuerySchema;

  static projectMemberParamSchema = ProjectSchema.projectParamSchema.extend({
    memberId: z.cuid({ error: "Invalid member ID" }),
  });

  static createProjectMemberSchema = z.object({
    memberId: z.cuid({ error: "Invalid member ID" }),
  });
}
