import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import { errorMiddleware } from "./middleware/error.middleware";
import * as routes from "./routes";

const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", routes.authRouter);
app.use("/api", routes.indexRouter);

app.use((_rreq, res) => {
  res.status(404).json({
    status: 404,
    message: "The route you are looking for does not exist.",
  });
});

app.use(errorMiddleware);

export default app;
