import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../error/error-handler";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      details: err.details ?? undefined,
    });
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return res.status(409).json({
      statusCode: 409,
      message: "A record with these details already exists.",
    });
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    statusCode: 500,
    message: "Internal server error",
  });
};
