import { RequestHandler } from "express";

export const asyncHandler: (fn: RequestHandler) => RequestHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
