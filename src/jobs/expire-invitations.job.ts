import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { InvitationStatus } from "../generated/prisma/enums";

async function expirePendingInvitations() {
  const now = new Date();

  const result = await prisma.invitation.updateMany({
    where: {
      status: InvitationStatus.PENDING,
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: InvitationStatus.EXPIRED,
    },
  });
  console.log(result.count);
  return result.count;
}

export function registerInvitationExpirationJob() {
  cron.schedule(
    "0 * * * *",
    async () => {
      const startedAt = Date.now();

      try {
        const count = await expirePendingInvitations();

        console.info("Invitation expiration job completed", {
          expiredCount: count,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        console.error("Invitation expiration job failed", {
          error,
        });
      }
    },
    {
      timezone: "Africa/Lagos",
    },
  );
}
