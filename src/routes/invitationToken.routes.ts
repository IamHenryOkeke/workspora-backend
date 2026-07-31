import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { MemberRepository } from "../modules/member/member.repository";
import { InvitationTokenService } from "../modules/invitationToken/invitationToken.service";
import { InvitationTokenController } from "../modules/invitationToken/invitationToken.controller";
import { InvitationTokenSchema } from "../modules/invitationToken/invitationToken.schema";
import { InvitationTokenRepository } from "../modules/invitationToken/invitationToken.repository";

const invitationTokenRouter = Router();

const invitationTokenRepo = new InvitationTokenRepository();
const memberRepo = new MemberRepository();
const invitationTokenService = new InvitationTokenService(
  invitationTokenRepo,
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

invitationTokenRouter.post(
  "/:token/accept",
  validate({
    query: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationController.acceptInvitation,
);

invitationTokenRouter.post(
  "/:token/decline",
  validate({
    query: InvitationTokenSchema.invitationTokenParamSchema,
  }),
  invitationController.declineInvitation,
);

export default invitationTokenRouter;
