import app from "./app";
import { getEnv } from "./config/env";
import { redis } from "./lib/redis";

const PORT = getEnv("PORT") || 3000;

const startServer = async () => {
  try {
    await redis.connect();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

startServer();
