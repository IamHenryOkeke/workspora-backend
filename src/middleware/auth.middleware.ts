import { Request, Response, NextFunction } from "express";
import passport from "../config/passport-config";
import { AppError } from "../error/error-handler";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    "jwt",
    { session: false },
    function (err: unknown, user: Express.User, _info: unknown) {
      if (err) return next(err);
      if (!user)
        return next(new AppError("JWT expired. Please login again", 401));
      req.user = user;
      return next();
    },
  )(req, res, next);
};
