import { Router, Request, Response } from "express";

const indexRouter = Router();

indexRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    statusCode: 200,
    message: "Welcome to Workspora API",
  });
});

indexRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "OK" });
});

export default indexRouter;
