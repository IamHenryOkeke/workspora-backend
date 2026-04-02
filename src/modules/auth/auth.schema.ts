import z from "zod";

export class AuthSchema {
  static createUserSchema = z.object({
    fullName: z
      .string({ error: "Name is required" })
      .min(3, { error: "Name must be at least 3 characters long" }),
    email: z.email({ error: "Email must be valid" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters long" })
      .regex(/[A-Z]/, {
        error: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        error: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { error: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        error: "Password must contain at least one special character",
      }),
  });

  static verifyAccountQuerySchema = z.object({
    token: z
      .string()
      .min(3, { error: "Token must be at least 3 characters long" }),
  });
}
