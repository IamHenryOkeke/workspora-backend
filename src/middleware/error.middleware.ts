import type { Request, Response } from "express";
import type { CustomError } from "../lib/types";

export const errorMiddleware = (
  err: CustomError,
  _req: Request,
  res: Response,
) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    message: err.message || "Something went wrong",
    details: err.details ?? undefined,
  });
};
