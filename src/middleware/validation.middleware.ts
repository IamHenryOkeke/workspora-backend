import z, { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/error-handler";

type SchemaMap = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export const validate =
  (schemas: SchemaMap) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.error) {
        throw new AppError(
          "Validation failed",
          400,
          z.flattenError(result.error).fieldErrors,
        );
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.error)
        throw new AppError(
          "Validation failed",
          400,
          z.flattenError(result.error).fieldErrors,
        );
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.error)
        throw new AppError(
          "Validation failed",
          400,
          z.flattenError(result.error).fieldErrors,
        );
      req.params = result.data as Request["params"];
    }

    next();
  };
