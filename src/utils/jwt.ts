import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { AppError } from "../error/error-handler";

export const signJWT = (
  payload: object,
  type: "access" | "refresh",
  expiresAt: number,
): string => {
  const token = jwt.sign(
    payload,
    type === "access"
      ? getEnv("ACCESS_TOKEN_SECRET")
      : getEnv("REFRESH_TOKEN_SECRET"),
    {
      expiresIn: expiresAt,
    },
  );
  return token;
};

export const verifyJWT = <T>(
  token: string,
  type: "access" | "refresh",
): T | null => {
  try {
    const decoded = jwt.verify(
      token,
      type === "access"
        ? getEnv("ACCESS_TOKEN_SECRET")
        : getEnv("REFRESH_TOKEN_SECRET"),
    ) as T;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token has expired", 401);
    } else {
      throw new AppError("Invalid token.", 500);
    }
  }
};
