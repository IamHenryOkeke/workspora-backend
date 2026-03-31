import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

app.use((r_req, res) => {
  res.status(404).json({
    status: 404,
    message: "The route you are looking for does not exist.",
  });
});

app.use(errorMiddleware);

export default app;
