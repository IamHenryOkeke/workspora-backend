import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { InvitationSchema } from "../modules/invitation/invitation.schema";
import { InvitationRepository } from "../modules/invitation/invitation.repository";
import { InvitationService } from "../modules/invitation/invitation.service";
import { InvitationController } from "../modules/invitation/invitation.controller";
import { OrganizationRepository } from "../modules/organization/organization.repository";

const invitationRouter = Router({ mergeParams: true });

invitationRouter.use(isAuthenticated);

const invitationRepo = new InvitationRepository();
const organizationRepo = new OrganizationRepository();
const invitationService = new InvitationService(
  invitationRepo,
  organizationRepo,
);
const invitationController = new InvitationController(invitationService);

invitationRouter.get(
  "/",
  validate({
    query: InvitationSchema.querySchema,
  }),
  invitationController.getInvitations,
);

invitationRouter.get(
  "/:invitationId",
  validate({
    params: InvitationSchema.invitationParamSchema,
  }),
  invitationController.getInvitation,
);

invitationRouter.post(
  "/",
  validate({
    body: InvitationSchema.createInvitationSchema,
  }),
  invitationController.createInvitation,
);

invitationRouter.delete(
  "/:invitationId",
  validate({
    params: InvitationSchema.invitationParamSchema,
  }),
  invitationController.revokeInvitation,
);

invitationRouter.post(
  "/:invitationId/resend",
  validate({
    params: InvitationSchema.invitationParamSchema,
  }),
  invitationController.resendInvitationEmail,
);

export default invitationRouter;
