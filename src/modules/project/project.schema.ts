import z from "zod";
import { CommonSchema } from "../../common/common.schema";

export class ProjectSchema {
  static querySchema = CommonSchema.paginationQuerySchema.extend({
    status: z
      .enum(["PENDING", "COMPLETED", "ACTIVE", "ARCHIVED"], {
        error: "Please enter a valid status value",
      })
      .optional(),

    organizationId: z.cuid({ error: "Invalid organization ID" }),
  });

  static projectParamSchema = z.object({
    projectId: z.cuid({ error: "Invalid project ID" }),
  });

  static createProjectSchema = z.object({
    name: z.string().min(1, { message: "Project name is required" }),
    description: z
      .string()
      .min(1, { message: "Project description is required" }),
    organizationId: z.cuid({ error: "Invalid organization ID" }),
  });

  static updateProjectSchema = z.object({
    organizationId: z.cuid({ error: "Invalid organization ID" }),
    name: z.string().min(1, { message: "Project name is required" }).optional(),
    description: z
      .string()
      .min(1, { message: "Project description is required" })
      .optional(),
    status: z
      .enum(["PENDING", "COMPLETED", "ACTIVE", "ARCHIVED"], {
        error: "Please enter a valid status value",
      })
      .optional(),
  });
}
