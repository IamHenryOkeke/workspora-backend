import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { InvitationRepository } from "../modules/invitation/invitation.repository";
import { MemberRepository } from "../modules/member/member.repository";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { InvitationTokenService } from "../modules/invitationToken/invitationToken.service";
import { InvitationTokenController } from "../modules/invitationToken/invitationToken.controller";
import { InvitationTokenSchema } from "../modules/invitationToken/invitationToken.schema";

const invitationTokenRouter = Router();

const invitationRepo = new InvitationRepository();
const organizationRepo = new OrganizationRepository();
const memberRepo = new MemberRepository();
const invitationTokenService = new InvitationTokenService(
  invitationRepo,
  organizationRepo,
  memberRepo,
);
const invitationController = new InvitationTokenController(
  invitationTokenService,
);

invitationTokenRouter.get(
  "/:token",
  validate({
    query: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationController.previewInvitation,
);

invitationTokenRouter.use(isAuthenticated);

// invitationTokenRouter.post(
//   "/:token/accept",
//   invitationController.acceptInvitation
// );

// invitationTokenRouter.post(
//   "/:token/decline",
//   invitationController.declineInvitation
// );

export default invitationTokenRouter;
