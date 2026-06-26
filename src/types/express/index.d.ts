import { JwtPayload } from "./auth";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      email: string;
      avatar?: string | null;
      isVerified: boolean;
    }
    interface Request {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatedQuery?: any;
    }
  }
}

export {};
