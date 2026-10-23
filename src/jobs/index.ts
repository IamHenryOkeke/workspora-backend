import { registerInvitationExpirationJob } from "./expire-invitations.job";

export function registerCronJobs() {
  registerInvitationExpirationJob();

  console.info("All cron jobs registered");
}
