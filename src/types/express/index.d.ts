import { JwtPayload } from "./auth";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      email: string;
      avatar?: string | null;
      isVerified: boolean;
    }
  }
}

declare module "express" {
  interface Request {
    validatedQuery?: Record<string, unknown>;
    validatedBody?: Record<string, unknown>;
    validatedParams?: Record<string, unknown>;
  }
}
