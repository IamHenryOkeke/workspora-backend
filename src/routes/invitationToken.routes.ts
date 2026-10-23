import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { MemberRepository } from "../modules/member/member.repository";
import { InvitationTokenService } from "../modules/invitationToken/invitationToken.service";
import { InvitationTokenController } from "../modules/invitationToken/invitationToken.controller";
import { InvitationTokenSchema } from "../modules/invitationToken/invitationToken.schema";
import { InvitationTokenRepository } from "../modules/invitationToken/invitationToken.repository";
import { optionalAuth } from "../middleware/optionalAuth.middleware";

const invitationTokenRouter = Router();

invitationTokenRouter.use(optionalAuth);

const invitationTokenRepo = new InvitationTokenRepository();
const memberRepo = new MemberRepository();
const invitationTokenService = new InvitationTokenService(
  invitationTokenRepo,
  memberRepo,
);
const invitationTokenController = new InvitationTokenController(
  invitationTokenService,
);

invitationTokenRouter.get(
  "/:token",
  validate({
    params: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationTokenController.previewInvitation,
);

invitationTokenRouter.use(isAuthenticated);

invitationTokenRouter.post(
  "/:token/accept",
  validate({
    params: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationTokenController.acceptInvitation,
);

invitationTokenRouter.post(
  "/:token/decline",
  validate({
    params: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationTokenController.declineInvitation,
);

export default invitationTokenRouter;
