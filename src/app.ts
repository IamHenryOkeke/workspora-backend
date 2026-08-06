import express from "express";
import cors from "cors";
import corsOptions from "./config/cors";
import { errorMiddleware } from "./middleware/error.middleware";
import * as routes from "./routes";
import passport from "./config/passport-config";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/v1/auth", routes.authRouter);
app.use("/api/v1/users", routes.userRouter);
app.use("/api/v1/organizations", routes.organizationRouter);
app.use("/api/v1/organizations/:organizationId/members", routes.memberRouter);
app.use(
  "/api/v1/organizations/:organizationId/invitations",
  routes.invitationRouter,
);
app.use("/api/v1/invitations", routes.invitationTokenRouter);
app.use("/api/v1/projects", routes.projectRouter);
app.use("/api/v1/projects/:projectId/members", routes.projectMemberRouter);
app.use("/api/v1", routes.indexRouter);

app.use((_req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "The route you are looking for does not exist.",
  });
});

app.use(errorMiddleware);

export default app;
