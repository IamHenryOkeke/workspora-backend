import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ProjectMemberService } from "./projectMember.service";
import { User } from "../../generated/prisma/client";

export class ProjectMemberController {
  constructor(private projectMemberService: ProjectMemberService) {}

  getProjectMembers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId } = req.params;

      const projectMembers = await this.projectMemberService.getProjectMembers(
        user.id,
        projectId as string,
        req.validatedQuery,
      );

      res.status(200).json({
        message: "Project members fetched successfully",
        data: {
          projectMembers,
        },
      });
    },
  );

  createProjectMember = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId } = req.params;
      const projectMember = await this.projectMemberService.createProjectMember(
        user.id,
        projectId as string,
        req.body,
      );

      res.status(201).json({
        message: "Project member created successfully",
        data: {
          projectMember,
        },
      });
    },
  );

  removeProjectMember = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { projectId, memberId } = req.params;

      await this.projectMemberService.removeProjectMember(
        user.id,
        projectId as string,
        memberId as string,
      );

      res.status(200).json({
        message: "Project member removed successfully",
      });
    },
  );
}
