import { Request, Response, NextFunction } from "express";

export const addFilePathToBody =
  (key: string) => (req: Request, _res: Response, next: NextFunction) => {
    if (req.file?.path) {
      req.body[key] = req.file.path;
      return next();
    }

    delete req.body[key];
    next();
  };
