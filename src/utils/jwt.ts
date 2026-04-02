import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { AppError } from "../error/error-handler";

export const signJWT = (payload: object, expiresAt: number): string => {
  const token = jwt.sign(payload, getEnv("JWT_SECRET"), {
    expiresIn: expiresAt,
  });
  return token;
};

export const verifyJWT = <T>(token: string): T | null => {
  try {
    const decoded = jwt.verify(token, getEnv("JWT_SECRET")) as T;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token has expired. Please request a new one.", 401);
    } else {
      throw new AppError("Invalid token.", 500);
    }
  }
};
