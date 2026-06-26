import z from "zod";

export class CommonSchema {
  static paginationQuerySchema = z.object({
    page: z
      .string()
      .regex(/^\d+$/, { error: "Page must be a positive integer" })
      .transform(Number)
      .default(1),
    limit: z
      .string()
      .regex(/^\d+$/, { error: "Limit must be a positive integer" })
      .transform(Number)
      .default(6),
    searchTerm: z.string().trim().toLowerCase().optional(),
  });
}
