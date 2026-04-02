import rateLimit from "express-rate-limit";
import { RedisStore, SendCommandFn } from "rate-limit-redis";
import { AppError } from "../error/error-handler";
import { redis } from "../lib/ioredis";

export const rateLimiter = (max = 100) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: ((command: string, ...args: string[]) =>
        redis.call(command, ...args)) as SendCommandFn,
    }),
    handler: (_req, _res) => {
      throw new AppError("Too many attempts, please try again later.", 429);
    },
  });
