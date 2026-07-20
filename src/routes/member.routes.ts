import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { MemberRepository } from "../modules/member/member.repository";
import { MemberService } from "../modules/member/member.service";
import { MemberController } from "../modules/member/member.controller";
import { validate } from "../middleware/validation.middleware";
import { MemberSchema } from "../modules/member/member.schema";
import { OrganizationRepository } from "../modules/organization/organization.repository";

const memberRouter = Router({ mergeParams: true });

memberRouter.use(isAuthenticated);

const memberRepo = new MemberRepository();
const organizationRepo = new OrganizationRepository();
const memberService = new MemberService(memberRepo, organizationRepo);
const memberController = new MemberController(memberService);

memberRouter.get(
  "/",
  validate({
    query: MemberSchema.querySchema,
  }),
  memberController.getMembers,
);

memberRouter.get(
  "/:memberId",
  validate({
    params: MemberSchema.memberParamSchema,
  }),
  memberController.getMember,
);

memberRouter.put(
  "/:memberId/update-role",
  validate({
    params: MemberSchema.memberParamSchema,
    body: MemberSchema.updateMemberRoleSchema,
  }),
  memberController.updateMemberRole,
);

memberRouter.delete(
  "/:memberId/delete",
  validate({
    params: MemberSchema.memberParamSchema,
  }),
  memberController.removeMember,
);

export default memberRouter;
