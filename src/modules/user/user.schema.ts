import z from "zod";

export class UserSchema {
  static updateUserSchema = z
    .object({
      fullName: z
        .string({ error: "Name must be a string" })
        .trim()
        .min(3, { error: "Name must be at least 3 characters long" })
        .optional(),
      avatar: z.url({ error: "Avatar must be a valid URL" }).optional(),
      phoneNumber: z
        .string({ error: "Phone number must be a string" })
        .regex(/^\+?[0-9]{10,15}$/, {
          error: "Phone number must be valid (e.g., +2348012345678)",
        })
        .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update",
      path: ["updateData"],
    });

  static updateUserProfilePictureSchema = z.object({
    avatar: z.url({ error: "Avatar must be a valid URL" }),
  });

  static updateUserPasswordSchema = z.object({
    currentPassword: z.string({ error: "Current password is required" }),
    newPassword: z
      .string({ error: "New password is required" })
      .min(8, { error: "New password must be at least 8 characters long" })
      .regex(/[A-Z]/, {
        error: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        error: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { error: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        error: "Password must contain at least one special character",
      })
      .trim(),
  });

  static querySchema = z.object({
    page: z
      .string()
      .regex(/^\d+$/, { error: "Page must be a positive integer" })
      .transform(Number)
      .default(1)
      .optional(),

    limit: z
      .string()
      .regex(/^\d+$/, { error: "Limit must be a positive integer" })
      .transform(Number)
      .default(10)
      .optional(),

    searchTerm: z.string().trim().optional(),
  });
}
