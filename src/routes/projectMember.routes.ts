import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { ProjectMemberRepository } from "../modules/projectMember/projectMember.repository";
import { ProjectMemberController } from "../modules/projectMember/projectMember.controller";
import { ProjectMemberService } from "../modules/projectMember/projectMember.service";
import { ProjectMemberSchema } from "../modules/projectMember/projectMember.schema";
import { ProjectRepository } from "../modules/project/project.repository";
import { OrganizationRepository } from "../modules/organization/organization.repository";

const projectMemberRouter = Router();

const projectRepo = new ProjectRepository();
const organizationRepo = new OrganizationRepository();
const projectMemberRepo = new ProjectMemberRepository();
const projectMemberService = new ProjectMemberService(
  projectMemberRepo,
  projectRepo,
  organizationRepo,
);
const projectMemberController = new ProjectMemberController(
  projectMemberService,
);

projectMemberRouter.use(isAuthenticated);

projectMemberRouter.get(
  "/",
  validate({
    params: ProjectMemberSchema.projectParamSchema,
  }),
  projectMemberController.getProjectMembers,
);

projectMemberRouter.post(
  "/",
  validate({
    body: ProjectMemberSchema.createProjectMemberSchema,
    params: ProjectMemberSchema.projectParamSchema,
  }),
  projectMemberController.createProjectMember,
);

projectMemberRouter.delete(
  "/:memberId",
  validate({
    params: ProjectMemberSchema.projectMemberParamSchema,
  }),
  projectMemberController.removeProjectMember,
);

export default projectMemberRouter;
