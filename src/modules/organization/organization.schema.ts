import z from "zod";
import { CommonSchema } from "../../common/common.schema";

export class OrganizationSchema {
  static createOrganizationSchema = z.object({
    name: z
      .string({ error: "Name is required" })
      .min(3, { error: "Name must be at least 3 characters long" }),
    logo: z.url({ error: "Logo must be a valid URL" }),
    description: z
      .string({ error: "Description is required" })
      .min(10, { error: "Description must be at least 10 characters long" }),
  });

  static updateOrganizationSchema = this.createOrganizationSchema
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update",
      path: ["updateData"],
    });

  static organizationParamSchema = z.object({
    organizationId: z.cuid({ error: "Invalid organization ID" }),
  });

  static organizationSlugParamSchema = z.object({
    organizationSlug: z.string({ error: "Organization slug is required" }),
  });

  static querySchema = CommonSchema.paginationQuerySchema;
}
