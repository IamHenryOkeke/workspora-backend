import app from "./app";
import { getEnv } from "./config/env";

const PORT = getEnv("PORT") || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
