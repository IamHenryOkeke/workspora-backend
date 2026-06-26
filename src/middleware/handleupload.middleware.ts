import multer from "multer";
import { upload } from "../config/multer";
import { AppError } from "../error/error-handler";
import { NextFunction, Request, Response } from "express";

export const handleUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError("File too large", 400, {
            [fieldName]: `${fieldName} size should be less than 2MB`,
          }),
        );
      }
      // if (err instanceof multer.MulterError && err.code === "MISSING_FIELD_NAME") {
      //   return next(
      //     new AppError("Field missing", 400, {
      //       [fieldName]: `${fieldName} size should be less than 2MB`,
      //     }),
      //   );
      // }
      if (err) return next(err);
      next();
    });
  };
};
