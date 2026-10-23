import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env";
import { prisma } from "../lib/prisma";

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, getEnv("ACCESS_TOKEN_SECRET")) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        email: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token: user not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("Error in optionalAuth middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
