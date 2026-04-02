import { Queue } from "bullmq";
import { redis } from "../lib/ioredis";

export const emailQueue = new Queue("email-queue", {
  connection: redis.options,
});
