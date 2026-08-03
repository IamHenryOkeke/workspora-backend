import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { MemberService } from "./member.service";
import { User } from "../../generated/prisma/client";

export class MemberController {
  constructor(private memberService: MemberService) {}

  getMembers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId } = req.params;

      const { members, pagination } = await this.memberService.getMembers(
        user.id,
        organizationId as string,
        req.validatedQuery,
      );

      res.status(200).json({
        message: "Members fetched successfully",
        data: {
          members,
          pagination,
        },
      });
    },
  );

  getMember = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, memberId } = req.params;

      const member = await this.memberService.getMember(
        user.id,
        organizationId as string,
        memberId as string,
      );

      res.status(200).json({
        message: "Member fetched successfully",
        data: {
          member,
        },
      });
    },
  );

  updateMemberRole = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, memberId } = req.params;

      await this.memberService.updateMemberRole(
        user.id,
        organizationId as string,
        memberId as string,
        req.body,
      );

      res.status(200).json({
        message: "Member role updated successfully",
      });
    },
  );

  removeMember = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as User;
      const { organizationId, memberId } = req.params;

      await this.memberService.removeMember(
        user.id,
        organizationId as string,
        memberId as string,
      );

      res.status(200).json({
        message: "Member removed successfully",
      });
    },
  );
}
