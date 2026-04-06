import { Router } from "express";
// import { validate } from "../middleware/validation.middleware";
import { UserRepository } from "../modules/user/user.repository";
import { UserService } from "../modules/user/user.service";
import { UserController } from "../modules/user/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
// import { UserSchema } from "../modules/user/user.schema";

const userRouter = Router();

const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const userController = new UserController(userService);

userRouter.use("/user", isAuthenticated);

userRouter.get("/me", userController.getCurrentUser);

export default userRouter;
