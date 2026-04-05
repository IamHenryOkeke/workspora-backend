import app from "./app";
import { getEnv } from "./config/env";

const PORT = getEnv("PORT") || 5001;

console.log(`${PORT}`);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
