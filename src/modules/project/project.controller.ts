import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ProjectService } from "./project.service";
import { User } from "../../generated/prisma/client";

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  getProjects = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;

      const { projects, pagination } = await this.projectService.getProjects(
        user.id,
        organizationId as string,
        req.validatedQuery,
      );

      res.status(200).json({
        message: "Projects fetched successfully",
        data: {
          projects,
          pagination,
        },
      });
    },
  );

  getProjectById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId, organizationId } = req.params;

      const project = await this.projectService.getProjectById(
        user.id,
        projectId as string,
        organizationId as string,
      );

      res.status(200).json({
        message: "Project fetched successfully",
        data: {
          project,
        },
      });
    },
  );

  createProject = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;

      const project = await this.projectService.createProject(
        user.id,
        organizationId as string,
        req.body,
      );

      res.status(201).json({
        message: "Project created successfully",
        data: {
          project,
        },
      });
    },
  );

  updateProject = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId, organizationId } = req.params;

      const project = await this.projectService.updateProject(
        user.id,
        organizationId as string,
        projectId as string,
        req.body,
      );

      res.status(200).json({
        message: "Project updated successfully",
        data: {
          project,
        },
      });
    },
  );

  deleteProject = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId, organizationId } = req.params;

      await this.projectService.deleteProject(
        user.id,
        projectId as string,
        organizationId as string,
      );

      res.status(200).json({
        message: "Project deleted successfully",
      });
    },
  );
}
