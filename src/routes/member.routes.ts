import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { MemberRepository } from "../modules/member/member.repository";
import { MemberService } from "../modules/member/member.service";
import { MemberController } from "../modules/member/member.controller";
import { validate } from "../middleware/validation.middleware";
import { MemberSchema } from "../modules/member/member.schema";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { OrganizationSchema } from "../modules/organization/organization.schema";

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
    params: OrganizationSchema.organizationParamSchema,
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
  "/:memberId/update",
  validate({
    params: MemberSchema.memberParamSchema,
    body: MemberSchema.updateMemberSchema,
  }),
  memberController.updateMember,
);

memberRouter.delete(
  "/:memberId/delete",
  validate({
    params: MemberSchema.memberParamSchema,
  }),
  memberController.removeMember,
);

export default memberRouter;
