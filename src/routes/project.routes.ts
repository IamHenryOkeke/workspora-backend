import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { ProjectRepository } from "../modules/project/project.repository";
import { ProjectService } from "../modules/project/project.service";
import { ProjectController } from "../modules/project/project.controller";
import { validate } from "../middleware/validation.middleware";
import { ProjectSchema } from "../modules/project/project.schema";
import { OrganizationRepository } from "../modules/organization/organization.repository";

const projectRouter = Router();

const projectRepo = new ProjectRepository();
const organizationRepo = new OrganizationRepository();
const projectService = new ProjectService(projectRepo, organizationRepo);
const projectController = new ProjectController(projectService);

projectRouter.use(isAuthenticated);

projectRouter.get(
  "/",
  validate({
    query: ProjectSchema.querySchema,
  }),
  projectController.getProjects,
);

projectRouter.get(
  "/:projectId",
  validate({
    params: ProjectSchema.projectParamSchema,
    query: ProjectSchema.querySchema,
  }),
  projectController.getProjectById,
);

projectRouter.post(
  "/",
  validate({
    body: ProjectSchema.createProjectSchema,
  }),
  projectController.createProject,
);

projectRouter.put(
  "/:projectId",
  validate({
    params: ProjectSchema.projectParamSchema,
    body: ProjectSchema.updateProjectSchema,
  }),
  projectController.updateProject,
);

projectRouter.delete(
  "/:projectId",
  validate({
    params: ProjectSchema.projectParamSchema,
    query: ProjectSchema.querySchema,
  }),
  projectController.deleteProject,
);

export default projectRouter;
