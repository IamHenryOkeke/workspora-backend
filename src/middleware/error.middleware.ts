import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../error/error-handler";
import logger from "../utils/logger";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Handle custom application errors
  if (err instanceof AppError) {
    logger.warn(
      {
        err,
        statusCode: err.statusCode,
        method: req.method,
        url: req.originalUrl,
        details: err.details,
      },
      err.message,
    );

    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      details: err.details ?? undefined,
    });
  }

  // Handle Prisma unique constraint errors
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    logger.warn(
      {
        err,
        statusCode: 409,
        method: req.method,
        url: req.originalUrl,
        prismaCode: err.code,
        target: err.meta?.target,
      },
      "Prisma unique constraint violation",
    );

    return res.status(409).json({
      statusCode: 409,
      message: "A record with these details already exists.",
    });
  }

  // Handle unexpected errors
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl,
      statusCode: 500,
    },
    "Unhandled application error",
  );

  return res.status(500).json({
    statusCode: 500,
    message: "Internal server error",
  });
};
