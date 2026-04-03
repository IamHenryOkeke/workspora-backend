import { Job, Worker } from "bullmq";
import { sendMail } from "../lib/nodemailer";
import { redis } from "../lib/ioredis";

new Worker(
  "email-queue",
  async (job: Job) => {
    const { title, to, content } = job.data;

    await sendMail(title, to, content);
  },
  { connection: redis.options },
);
