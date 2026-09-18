import { createClient } from "redis";
import { getEnv } from "../config/env";

export const redis = createClient({
  url: getEnv("REDIS_URL") || "redis://localhost:6379",
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});
