import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "../lib/prisma";

const indexRouter = Router();

indexRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    statusCode: 200,
    message: "Welcome to Workspora API",
  });
});

indexRouter.get("/health", async (_req: Request, res: Response) => {
  const databaseConnected = await checkDatabaseConnection();
  res.json({
    status: "OK",
    uptime: process.uptime(),
    database: databaseConnected ? "connected" : "disconnected",
  });
});

export default indexRouter;
