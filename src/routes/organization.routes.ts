import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { OrganizationService } from "../modules/organization/organization.service";
import { OrganizationController } from "../modules/organization/organization.controller";
import { validate } from "../middleware/validation.middleware";
import { OrganizationSchema } from "../modules/organization/organization.schema";
import { handleUpload } from "../middleware/handleupload.middleware";
import { addFilePathToBody } from "../middleware/addFilePathToBody.middleware";

const organizationRouter = Router();

organizationRouter.use(isAuthenticated);

const organizationRepo = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepo);
const organizationController = new OrganizationController(organizationService);

organizationRouter.get(
  "/",
  validate({
    query: OrganizationSchema.querySchema,
  }),
  organizationController.getOrganizations,
);

organizationRouter.get(
  "/:organizationId",
  validate({
    params: OrganizationSchema.organizationParamSchema,
  }),
  organizationController.getOrganization,
);

organizationRouter.get(
  "/:organizationId/stats",
  validate({
    params: OrganizationSchema.organizationParamSchema,
  }),
  organizationController.getOrganizationStats,
);

organizationRouter.post(
  "/",
  handleUpload("logo"),
  addFilePathToBody("logo"),
  validate({
    body: OrganizationSchema.createOrganizationSchema,
  }),
  organizationController.createOrganization,
);

organizationRouter.put(
  "/:organizationId",
  handleUpload("logo"),
  addFilePathToBody("logo"),
  validate({
    params: OrganizationSchema.organizationParamSchema,
    body: OrganizationSchema.updateOrganizationSchema,
  }),
  organizationController.updateOrganization,
);

organizationRouter.delete(
  "/:organizationId",
  validate({
    params: OrganizationSchema.organizationParamSchema,
  }),
  organizationController.deleteOrganization,
);

export default organizationRouter;
