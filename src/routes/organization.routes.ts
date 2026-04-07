import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { OrganizationRepository } from "../modules/organization/organization.repository";
import { OrganizationService } from "../modules/organization/organization.service";
import { OrganizationController } from "../modules/organization/organization.controller";

const organizationRouter = Router();

organizationRouter.use(isAuthenticated);

const organizationRepo = new OrganizationRepository();
const organizationService = new OrganizationService(organizationRepo);
const _organizationController = new OrganizationController(organizationService);

organizationRouter.get("/me", (_req, res) => {
  res.json({ message: "Organization details endpoint" });
});

export default organizationRouter;
