import dotenv from "dotenv";
dotenv.config();

import { Job, Worker } from "bullmq";
import { redis } from "../lib/ioredis";
import { sendMail } from "../lib/nodemailer";

new Worker(
  "email-queue",
  async (job: Job) => {
    const { title, to, content } = job.data;

    await sendMail(title, to, content);
  },
  { connection: redis.options },
);
