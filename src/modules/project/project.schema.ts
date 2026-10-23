import z from "zod";
import { CommonSchema } from "../../common/common.schema";
import { OrganizationSchema } from "../organization/organization.schema";

export class ProjectSchema {
  static querySchema = CommonSchema.paginationQuerySchema.extend({
    status: z
      .enum(["PENDING", "COMPLETED", "ACTIVE", "ARCHIVED"], {
        error: "Please enter a valid status value",
      })
      .optional(),
  });

  static projectParamSchema = OrganizationSchema.organizationParamSchema.extend(
    {
      projectId: z.cuid({ error: "Invalid project ID" }),
    },
  );

  static createProjectSchema = z.object({
    name: z.string().min(1, { message: "Project name is required" }),
    description: z
      .string()
      .min(1, { message: "Project description is required" }),
  });

  static updateProjectSchema = z.object({
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
