import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { InvitationSchema } from "../modules/invitation/invitation.schema";
import { InvitationRepository } from "../modules/invitation/invitation.repository";
import { InvitationService } from "../modules/invitation/invitation.service";
import { InvitationController } from "../modules/invitation/invitation.controller";

const invitationRouter = Router({ mergeParams: true });

invitationRouter.use(isAuthenticated);

const invitationRepo = new InvitationRepository();
const invitationService = new InvitationService(invitationRepo);
const _invitationController = new InvitationController(invitationService);

invitationRouter.get(
  "/",
  validate({
    query: InvitationSchema.querySchema,
  }),
);

export default invitationRouter;
